/** The first administrator, as the setup's admin step asks for it. */
export interface AdminInput {
  email: string;
  username: string;
  name: string;
  password: string;
}

/** The starting content file for the setup's demo step. */
export interface DemoContent {
  tags: { title: string; description: string }[];
  /** `tag` is the title of one of the tags above. */
  posts: { tag: string; title: string; text: string }[];
}

export interface DemoSeedResult {
  tagsCreated: number;
  tagsKept: number;
  postsCreated: number;
  postsKept: number;
}
