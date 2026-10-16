"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SOLID_FINISH_CONNECT } from "@/graphql/mutations";
import { SOLID_CALLBACK_PATH } from "@/lib/constants/solid";
import { mapSolidError } from "@/lib/solid/solidErrors";
import type { SolidFinishConnectData, SolidFinishConnectVariables } from "@/types/solid";

const SUCCESS_REDIRECT_DELAY_MS = 1500;

const PROVIDER_ERROR_MESSAGE =
  "Your Pod provider did not finish the connection. You can try again from Settings.";
const INCOMPLETE_LINK_MESSAGE =
  "This connection link is incomplete. Start the connection again from Settings.";
const FINISH_FAILED_MESSAGE =
  "We could not finish connecting your Pod. Please try again from Settings.";

type CallbackState = { kind: "pending" } | { kind: "success" } | { kind: "error"; message: string };

function SolidCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<CallbackState>({ kind: "pending" });
  const [finishConnect] = useMutation<SolidFinishConnectData, SolidFinishConnectVariables>(
    SOLID_FINISH_CONNECT
  );
  // Guards against React strict-mode running the effect twice, which would
  // otherwise send the one-time authorization code to the API twice.
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const providerError = searchParams.get("error");
    const code = searchParams.get("code");
    const oauthState = searchParams.get("state");

    // Take the one-time code and state out of the address bar as soon as they are read.
    window.history.replaceState(null, "", SOLID_CALLBACK_PATH);

    if (providerError) {
      setState({ kind: "error", message: PROVIDER_ERROR_MESSAGE });
      return;
    }
    if (!code || !oauthState) {
      setState({ kind: "error", message: INCOMPLETE_LINK_MESSAGE });
      return;
    }

    finishConnect({
      variables: {
        code,
        state: oauthState,
        redirectUri: window.location.origin + SOLID_CALLBACK_PATH,
      },
    })
      .then(({ data }) => {
        if (data?.solidFinishConnect.success) {
          setState({ kind: "success" });
        } else {
          setState({ kind: "error", message: FINISH_FAILED_MESSAGE });
        }
      })
      .catch((err: unknown) => {
        setState({ kind: "error", message: mapSolidError(err).message });
      });
  }, [finishConnect, searchParams]);

  useEffect(() => {
    if (state.kind !== "success") return;
    const timer = setTimeout(() => router.replace("/settings"), SUCCESS_REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [state, router]);

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <h1 className="text-xl font-semibold">Solid Pod</h1>

        {state.kind === "pending" && (
          <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Finishing your Pod connection…
          </p>
        )}

        {state.kind === "success" && (
          <div className="space-y-3">
            <p role="status" className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
              Your Pod is connected. Taking you back to Settings…
            </p>
            <Button asChild variant="outline">
              <Link href="/settings">Go to Settings</Link>
            </Button>
          </div>
        )}

        {state.kind === "error" && (
          <div className="space-y-3">
            <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {state.message}
            </p>
            <Button asChild variant="outline">
              <Link href="/settings">Back to Settings</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SolidCallbackPage() {
  return (
    <div className="mx-auto max-w-xl py-6">
      <Suspense
        fallback={
          <p role="status" className="text-sm text-muted-foreground">
            Finishing your Pod connection…
          </p>
        }
      >
        <SolidCallbackContent />
      </Suspense>
    </div>
  );
}
