import { assertWebIdListsIssuer, isHttpsUrl, normaliseIssuer, parseWebIdIssuers } from '~/solid/oidc/webid';
import { SolidOidcError } from '~/solid/errors';

jest.mock('~/solid/oidc/security', () => ({
    assertPublicUrl: jest.fn().mockResolvedValue(undefined),
}));

const WEBID = 'https://pod.example/profile/card#me';
const ISSUER = 'https://issuer.example';

function response(body: string, contentType: string, init: { ok?: boolean; status?: number } = {}): Response {
    return {
        ok: init.ok ?? true,
        status: init.status ?? 200,
        headers: new Headers({ 'content-type': contentType }),
        text: async () => body,
    } as unknown as Response;
}

const jsonLd = (issuers: unknown): string =>
    JSON.stringify({
        '@graph': [
            {
                '@id': WEBID,
                'http://www.w3.org/ns/solid/terms#oidcIssuer': issuers,
            },
        ],
    });

describe('parseWebIdIssuers', () => {
    it('reads the full IRI key in JSON-LD', () => {
        expect(parseWebIdIssuers(jsonLd({ '@id': ISSUER }), 'application/ld+json')).toEqual([ISSUER]);
    });

    it('reads the compact solid:oidcIssuer key and plain string values', () => {
        const body = JSON.stringify({ '@id': WEBID, 'solid:oidcIssuer': ISSUER });
        expect(parseWebIdIssuers(body, 'application/json')).toEqual([ISSUER]);
    });

    it('returns every issuer listed in an array', () => {
        const body = jsonLd([{ '@id': 'https://a.example' }, { '@id': 'https://b.example' }]);
        expect(parseWebIdIssuers(body, 'application/ld+json')).toEqual(['https://a.example', 'https://b.example']);
    });

    it('returns an empty list for JSON without an issuer or for malformed JSON', () => {
        expect(parseWebIdIssuers('{"name":"x"}', 'application/json')).toEqual([]);
        expect(parseWebIdIssuers('{not json', 'application/json')).toEqual([]);
    });

    it('reads the Turtle form, full IRI and prefixed', () => {
        const turtle = `
@prefix solid: <http://www.w3.org/ns/solid/terms#> .
<${WEBID}> solid:oidcIssuer <${ISSUER}/> .`;
        expect(parseWebIdIssuers(turtle, 'text/turtle')).toEqual([`${ISSUER}/`]);

        const fullIri = `<${WEBID}> <http://www.w3.org/ns/solid/terms#oidcIssuer> <${ISSUER}> .`;
        expect(parseWebIdIssuers(fullIri, 'text/turtle')).toEqual([ISSUER]);
    });

    it('reads a Turtle list of issuers', () => {
        const turtle = `<${WEBID}> solid:oidcIssuer <https://a.example>, <https://b.example> .`;
        expect(parseWebIdIssuers(turtle, 'text/turtle')).toEqual(['https://a.example', 'https://b.example']);
    });

    it('returns nothing for Turtle without an issuer', () => {
        expect(parseWebIdIssuers(`<${WEBID}> <http://xmlns.com/foaf/0.1/name> "Ana" .`, 'text/turtle')).toEqual([]);
    });
});

describe('normaliseIssuer / isHttpsUrl', () => {
    it('strips trailing slashes', () => {
        expect(normaliseIssuer('https://issuer.example///')).toBe('https://issuer.example');
    });

    it('accepts only https URLs', () => {
        expect(isHttpsUrl(WEBID)).toBe(true);
        expect(isHttpsUrl('http://pod.example/profile#me')).toBe(false);
        expect(isHttpsUrl('javascript:alert(1)')).toBe(false);
        expect(isHttpsUrl('not a url')).toBe(false);
    });
});

describe('assertWebIdListsIssuer', () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    it('resolves when the profile lists the token issuer', async () => {
        (global.fetch as jest.Mock).mockResolvedValue(response(jsonLd({ '@id': ISSUER }), 'application/ld+json'));

        await expect(assertWebIdListsIssuer(WEBID, ISSUER)).resolves.toBeUndefined();
    });

    it('rejects a profile that lists a different issuer as invalid_response', async () => {
        (global.fetch as jest.Mock).mockResolvedValue(
            response(jsonLd({ '@id': 'https://evil.example' }), 'application/ld+json')
        );

        const error = await assertWebIdListsIssuer(WEBID, ISSUER).catch((e: unknown) => e);

        expect(error).toBeInstanceOf(SolidOidcError);
        expect((error as SolidOidcError).code).toBe('invalid_response');
    });

    it('accepts an issuer that differs only by a trailing slash', async () => {
        (global.fetch as jest.Mock).mockResolvedValue(response(jsonLd({ '@id': `${ISSUER}/` }), 'application/ld+json'));
        await expect(assertWebIdListsIssuer(WEBID, ISSUER)).resolves.toBeUndefined();

        (global.fetch as jest.Mock).mockResolvedValue(response(jsonLd({ '@id': ISSUER }), 'application/ld+json'));
        await expect(assertWebIdListsIssuer(WEBID, `${ISSUER}/`)).resolves.toBeUndefined();
    });

    it('accepts the token issuer when the profile lists several issuers', async () => {
        (global.fetch as jest.Mock).mockResolvedValue(
            response(jsonLd([{ '@id': 'https://other.example' }, { '@id': ISSUER }]), 'application/ld+json')
        );
        await expect(assertWebIdListsIssuer(WEBID, ISSUER)).resolves.toBeUndefined();
    });

    it('checks a Turtle profile', async () => {
        (global.fetch as jest.Mock).mockResolvedValue(
            response(`<${WEBID}> solid:oidcIssuer <${ISSUER}> .`, 'text/turtle')
        );
        await expect(assertWebIdListsIssuer(WEBID, ISSUER)).resolves.toBeUndefined();
    });

    it('rejects an http WebID without fetching it', async () => {
        const error = await assertWebIdListsIssuer('http://pod.example/profile#me', ISSUER).catch((e: unknown) => e);

        expect((error as SolidOidcError).code).toBe('invalid_response');
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('fetches the WebID with the required headers, no redirects and a timeout', async () => {
        (global.fetch as jest.Mock).mockResolvedValue(response(jsonLd({ '@id': ISSUER }), 'application/ld+json'));

        await assertWebIdListsIssuer(WEBID, ISSUER);

        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(WEBID);
        expect(init.redirect).toBe('error');
        expect(init.headers.Accept).toBe('application/ld+json, application/json, text/turtle');
        expect(init.signal).toBeDefined();
    });

    it('maps an unreachable or non-2xx profile to invalid_response without the URL', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('connect ECONNREFUSED pod.example:443'));
        const network = await assertWebIdListsIssuer(WEBID, ISSUER).catch((e: unknown) => e);
        expect((network as SolidOidcError).code).toBe('invalid_response');
        expect((network as Error).message).not.toMatch(/pod\.example|ECONNREFUSED/);

        (global.fetch as jest.Mock).mockResolvedValueOnce(response('', 'text/plain', { ok: false, status: 404 }));
        const notFound = await assertWebIdListsIssuer(WEBID, ISSUER).catch((e: unknown) => e);
        expect((notFound as SolidOidcError).code).toBe('invalid_response');
    });
});
