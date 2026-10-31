/** A GraphQL document exported from the frontend's src/graphql files. */
export interface FrontendDocument {
  name: string;
  file: string;
  line: number;
  source: string;
}

/** A document that fails against the backend: validation errors, or root fields with no resolver. */
export interface ContractProblem {
  name: string;
  file: string;
  line: number;
  messages: string[];
}

export interface ContractReport {
  checked: number;
  /** Documents that fail and aren't on the known-gaps list. */
  problems: ContractProblem[];
  /** Known gaps that now pass, so they should come off the list. */
  resolvedGaps: string[];
  /** Known gaps that still fail. */
  openGaps: string[];
  /** Known gaps with no matching frontend document, so they should come off the list. */
  missingGaps: string[];
}
