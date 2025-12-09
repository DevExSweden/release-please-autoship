export type CoreLike = {
  getInput: (name: string, options?: { required?: boolean }) => string;
  info: (message: string) => void;
  warning: (message: string) => void;
  setFailed: (message: string) => void;
};

export type NotionClientLike = {
  pages: {
    create: (args: any) => Promise<{ id: string }>;
  };
  blocks?: {
    children: {
      append: (args: any) => Promise<any>;
    };
  };
};

export type NotionClientConstructor = new (args: { auth: string }) => NotionClientLike;

export type Inputs = {
  notionToken: string;
  databaseId: string;
  titlePropertyName: string;
  title: string;
  properties: Record<string, unknown>;
  body: string;
  bodyType: string;
};


