import { CombinedGraphQLErrors } from "@apollo/client/errors";
import {
  INVITE_ALREADY_SENT_MESSAGE,
  isInviteAlreadySentError,
} from "@/lib/utils/inviteAlreadySent";

describe("isInviteAlreadySentError (#691)", () => {
  it("recognises the API's open-invite refusal", () => {
    const error = new CombinedGraphQLErrors({
      errors: [
        {
          message:
            "An invite was already sent to this email. Check your inbox for the signup link.",
          extensions: { code: "BAD_USER_INPUT" },
        },
      ],
    });
    expect(isInviteAlreadySentError(error)).toBe(true);
  });

  it("ignores other errors and non-errors", () => {
    const other = new CombinedGraphQLErrors({
      errors: [{ message: "Email already exists", extensions: { code: "BAD_USER_INPUT" } }],
    });
    expect(isInviteAlreadySentError(other)).toBe(false);
    expect(isInviteAlreadySentError(new Error("Network down"))).toBe(false);
    expect(isInviteAlreadySentError("An invite was already sent")).toBe(false);
    expect(isInviteAlreadySentError(undefined)).toBe(false);
  });

  it("tells the person where to look", () => {
    expect(INVITE_ALREADY_SENT_MESSAGE).toMatch(/check your inbox/i);
  });
});
