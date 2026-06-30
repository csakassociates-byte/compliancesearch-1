declare module "html-to-docx" {
  interface DocumentOptions {
    orientation?: "portrait" | "landscape";
    pageSize?: { width?: number; height?: number };
    margins?: { top?: number; right?: number; bottom?: number; left?: number; header?: number; footer?: number; gutter?: number };
    title?: string;
    subject?: string;
    creator?: string;
    keywords?: string[];
    description?: string;
    font?: string;
    fontSize?: number;
    header?: boolean;
    footer?: boolean;
    pageNumber?: boolean;
    table?: { row?: { cantSplit?: boolean } };
    lang?: string;
  }
  function HTMLtoDOCX(
    htmlString: string,
    headerHTMLString: string | null,
    documentOptions?: DocumentOptions,
    footerHTMLString?: string | null
  ): Promise<Blob | Buffer>;
  export default HTMLtoDOCX;
}
