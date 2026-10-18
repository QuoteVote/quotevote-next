"use client";

import { useState } from "react";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getDefaultSolidIssuer } from "@/lib/constants/solid";
import { mapSolidError, type SolidErrorInfo } from "@/lib/solid/solidErrors";
import { GET_SOLID_CONNECTION_STATUS, SOLID_PULL_PORTABLE_STATE } from "@/graphql/queries";
import {
  SOLID_DISCONNECT,
  SOLID_PUSH_PORTABLE_STATE,
  SOLID_START_CONNECT,
} from "@/graphql/mutations";
import type {
  PortableState,
  PortableStateInput,
  SolidConnectionStatusData,
  SolidDisconnectData,
  SolidPodCardProps,
  SolidPullPortableStateData,
  SolidPushPortableStateData,
  SolidStartConnectData,
  SolidStartConnectVariables,
} from "@/types/solid";

function formatSyncTime(iso: string | null): string {
  if (!iso) return "Not synced yet";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

function isValidIssuer(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export default function SolidPodCard({ displayName, bio, avatarUrl, theme }: SolidPodCardProps) {
  const [issuerInput, setIssuerInput] = useState<string>(getDefaultSolidIssuer);
  const [actionError, setActionError] = useState<SolidErrorInfo | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pulled, setPulled] = useState<PortableState | null>(null);

  const statusQuery = useQuery<SolidConnectionStatusData>(GET_SOLID_CONNECTION_STATUS, {
    fetchPolicy: "network-only",
  });
  const [startConnect, { loading: connecting }] = useMutation<
    SolidStartConnectData,
    SolidStartConnectVariables
  >(SOLID_START_CONNECT);
  const [pushState, { loading: pushing }] = useMutation<
    SolidPushPortableStateData,
    { input: PortableStateInput }
  >(SOLID_PUSH_PORTABLE_STATE);
  const [disconnect, { loading: disconnecting }] =
    useMutation<SolidDisconnectData>(SOLID_DISCONNECT);
  // Pull only reads from the Pod, so it is a query, fetched on demand.
  const [pullPortableState, { loading: pulling }] = useLazyQuery<SolidPullPortableStateData>(
    SOLID_PULL_PORTABLE_STATE,
    { fetchPolicy: "network-only" }
  );

  const status = statusQuery.data?.solidConnectionStatus;
  const busy = connecting || pushing || pulling || disconnecting;

  const handleConnect = async (rawIssuer: string) => {
    const issuer = rawIssuer.trim();
    setNotice(null);
    if (!issuer || !isValidIssuer(issuer)) {
      setActionError({
        message: "Enter a full web address for your Pod provider, like https://solidcommunity.net.",
        needsReconnect: false,
      });
      return;
    }
    setActionError(null);
    try {
      const { data } = await startConnect({ variables: { issuer } });
      const authorizationUrl = data?.solidStartConnect.authorizationUrl;
      if (!authorizationUrl) {
        setActionError(mapSolidError(null));
        return;
      }
      window.location.assign(authorizationUrl);
    } catch (err) {
      setActionError(mapSolidError(err));
    }
  };

  const handleSync = async () => {
    setNotice(null);
    setActionError(null);
    const input: PortableStateInput = {
      profile: {
        ...(displayName.trim() ? { displayName: displayName.trim() } : {}),
        bio,
        ...(avatarUrl ? { avatarUrl } : {}),
      },
      preferences: { theme },
    };
    try {
      await pushState({
        variables: { input },
        refetchQueries: [{ query: GET_SOLID_CONNECTION_STATUS }],
        awaitRefetchQueries: true,
      });
      setNotice("Your profile and preferences were saved to your Pod.");
    } catch (err) {
      setActionError(mapSolidError(err));
    }
  };

  const handlePull = async () => {
    setNotice(null);
    setActionError(null);
    try {
      const result = await pullPortableState();
      if (result.error) {
        setActionError(mapSolidError(result.error));
        return;
      }
      if (!result.data) {
        setActionError(mapSolidError(null));
        return;
      }
      setPulled(result.data.solidPullPortableState);
    } catch (err) {
      setActionError(mapSolidError(err));
    }
  };

  const handleDisconnect = async () => {
    setNotice(null);
    setActionError(null);
    try {
      await disconnect({
        refetchQueries: [{ query: GET_SOLID_CONNECTION_STATUS }],
        awaitRefetchQueries: true,
      });
      setPulled(null);
      setNotice("Your Pod is disconnected. Quote.Vote works as usual.");
    } catch (err) {
      setActionError(mapSolidError(err));
    }
  };

  const renderBody = () => {
    if (statusQuery.loading && !status) {
      return (
        <p className="text-sm text-muted-foreground" role="status">
          Checking your Pod connection…
        </p>
      );
    }

    if (statusQuery.error && !status) {
      return (
        <div className="space-y-3">
          <p role="alert" className="text-sm text-destructive">
            {mapSolidError(statusQuery.error).message}
          </p>
          <Button type="button" variant="outline" onClick={() => void statusQuery.refetch()}>
            Try again
          </Button>
        </div>
      );
    }

    if (!status?.connected) {
      return (
        <form
          className="space-y-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void handleConnect(issuerInput);
          }}
        >
          <p className="text-sm text-muted-foreground">
            Your Pod is a personal data space you control. Connect one to keep a copy of your
            profile and preferences there. Quote.Vote works the same whether or not you connect.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="solid-issuer">Pod provider address</Label>
            <Input
              id="solid-issuer"
              type="url"
              value={issuerInput}
              onChange={(e) => setIssuerInput(e.target.value)}
              disabled={busy}
              placeholder="https://solidcommunity.net"
            />
          </div>
          {actionError && (
            <p role="alert" className="text-sm text-destructive">
              {actionError.message}
            </p>
          )}
          <Button type="submit" disabled={busy}>
            {connecting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Connecting…
              </>
            ) : (
              "Connect Pod"
            )}
          </Button>
        </form>
      );
    }

    return (
      <div className="space-y-4">
        <dl className="grid gap-3 text-sm sm:grid-cols-[8rem_1fr]">
          <dt className="text-muted-foreground">Your WebID</dt>
          <dd className="break-all font-mono text-xs">{status.webId ?? "Unknown"}</dd>
          <dt className="text-muted-foreground">Provider</dt>
          <dd className="break-all">{status.issuer ?? "Unknown"}</dd>
          <dt className="text-muted-foreground">Last sync</dt>
          <dd>{formatSyncTime(status.lastSyncAt)}</dd>
        </dl>

        <Separator />

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => void handleSync()} disabled={busy}>
            {pushing ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Syncing…
              </>
            ) : (
              "Sync profile & preferences to Pod"
            )}
          </Button>
          <Button type="button" variant="outline" onClick={() => void handlePull()} disabled={busy}>
            {pulling ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Checking…
              </>
            ) : (
              "Check Pod data"
            )}
          </Button>
        </div>

        {actionError && (
          <div className="space-y-2">
            <p role="alert" className="text-sm text-destructive">
              {actionError.message}
            </p>
            {actionError.needsReconnect && (
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleConnect(status.issuer ?? issuerInput)}
                disabled={busy}
              >
                Reconnect
              </Button>
            )}
          </div>
        )}

        {pulled && (
          <div className="space-y-2 rounded-md border border-border p-3 text-sm">
            <p className="font-medium">What your Pod has (read-only)</p>
            <dl className="grid gap-2 sm:grid-cols-[8rem_1fr]">
              <dt className="text-muted-foreground">Display name</dt>
              <dd>{pulled.profile.displayName || "—"}</dd>
              <dt className="text-muted-foreground">About</dt>
              <dd className="whitespace-pre-wrap break-words">{pulled.profile.bio || "—"}</dd>
              <dt className="text-muted-foreground">Photo link</dt>
              <dd className="break-all">{pulled.profile.avatarUrl || "—"}</dd>
              <dt className="text-muted-foreground">Theme</dt>
              <dd>{pulled.preferences.theme || "—"}</dd>
              <dt className="text-muted-foreground">Last updated</dt>
              <dd>{formatSyncTime(pulled.updatedAt)}</dd>
            </dl>
          </div>
        )}

        <Separator />

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="ghost" className="text-destructive" disabled={busy}>
              Disconnect
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect your Pod?</AlertDialogTitle>
              <AlertDialogDescription>
                Quote.Vote will stop syncing with your Pod. Your data stays in your Pod and your
                Quote.Vote account is not affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => void handleDisconnect()}>
                Disconnect
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="text-lg font-semibold">Solid Pod</h2>
            <p className="text-sm text-muted-foreground">
              Keep a copy of your profile and preferences in a Pod you control.
            </p>
          </div>
          {status?.connected ? (
            <Badge variant="secondary">Connected</Badge>
          ) : (
            status && <Badge variant="outline">Not connected</Badge>
          )}
        </div>

        {notice && (
          <p role="status" className="text-sm text-muted-foreground">
            {notice}
          </p>
        )}

        {renderBody()}
      </CardContent>
    </Card>
  );
}
