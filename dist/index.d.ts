interface PdfOptions {
    format?: 'A4' | 'Letter' | 'Legal';
    landscape?: boolean;
    margin?: {
        top?: string;
        right?: string;
        bottom?: string;
        left?: string;
    };
    printBackground?: boolean;
    basePath?: string;
}
declare function generatePdf(html: string, options?: PdfOptions): Promise<Buffer>;
declare function generatePdfToFile(html: string, outputPath: string, options?: PdfOptions): Promise<void>;

interface ParseOptions {
    gfm?: boolean;
}
declare function parseMarkdown(markdown: string, options?: ParseOptions): string;
declare function parseMarkdownFile(filePath: string, options?: ParseOptions): Promise<string>;

interface WrapHtmlOptions {
    title?: string;
    style?: string;
}
declare function wrapHtml(contentHtml: string, options?: WrapHtmlOptions): string;

interface ConvertOptions {
    output?: string;
    title?: string;
    style?: string;
    format?: PdfOptions['format'];
    landscape?: boolean;
    margin?: PdfOptions['margin'];
}
declare function convertMdToPdf(inputPath: string, options?: ConvertOptions): Promise<string>;
declare function convertMarkdownToPdfBuffer(markdown: string, options?: ConvertOptions): Promise<Buffer>;

export { type ConvertOptions, type ParseOptions, type PdfOptions, type WrapHtmlOptions, convertMarkdownToPdfBuffer, convertMdToPdf, generatePdf, generatePdfToFile, parseMarkdown, parseMarkdownFile, wrapHtml };
