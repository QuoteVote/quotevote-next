export interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article" | "profile";
  noIndex?: boolean;
  publishedTime?: string;
}

export interface PostMetadataData {
  _id: string;
  title?: string | null;
  text?: string | null;
  url?: string | null;
  created?: string | null;
  creator?: {
    name?: string | null;
    username?: string | null;
  } | null;
}

export interface UserMetadataData {
  _id: string;
  name?: string | null;
  username: string;
  avatar?: string | Record<string, unknown> | null;
}

export interface SitemapPostData {
  url?: string | null;
  created?: string | null;
  creator?: {
    username?: string | null;
  } | null;
}

export interface GraphqlResponse<TData> {
  data?: TData | null;
  errors?: Array<{ message: string }>;
}

export type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | JsonLdObject
  | JsonLdValue[];

export interface JsonLdObject {
  [key: string]: JsonLdValue;
}

export interface JsonLdProps {
  data: JsonLdObject;
}
