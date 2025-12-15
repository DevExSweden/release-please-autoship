export type RichText = {
  plain_text: string;
  href: string | null;
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
};

export type BlockObject = {
  id: string;
  type: string;
  has_children?: boolean;
  [key: string]: any;
};

export type BlockNode = {
  block: BlockObject;
  children: BlockNode[];
};


