import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {cn} from '../lib/utils';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export const MarkdownRenderer = ({content, className}: MarkdownRendererProps) => {
    return (
        <div className={cn("prose prose-sm max-w-none dark:prose-invert", className)}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({children}) => (
                        <h1 className="text-2xl font-bold text-foreground mb-4 mt-6 first:mt-0 border-b border-border pb-2">
                            {children}
                        </h1>
                    ),
                    h2: ({children}) => (
                        <h2 className="text-xl font-semibold text-foreground mb-3 mt-5 first:mt-0 border-b border-border pb-1">
                            {children}
                        </h2>
                    ),
                    h3: ({children}) => (
                        <h3 className="text-lg font-semibold text-foreground mb-2 mt-4 first:mt-0">
                            {children}
                        </h3>
                    ),
                    h4: ({children}) => (
                        <h4 className="text-base font-semibold text-foreground mb-2 mt-3 first:mt-0">
                            {children}
                        </h4>
                    ),
                    h5: ({children}) => (
                        <h5 className="text-sm font-semibold text-foreground mb-2 mt-3 first:mt-0">
                            {children}
                        </h5>
                    ),
                    h6: ({children}) => (
                        <h6 className="text-sm font-medium text-foreground mb-2 mt-3 first:mt-0">
                            {children}
                        </h6>
                    ),
                    p: ({children}) => (
                        <p className="text-foreground leading-relaxed mb-4 last:mb-0">
                            {children}
                        </p>
                    ),
                    code: ({children, className, ...props}) => {
                        const isInline = !className?.includes('language-');
                        if (isInline) {
                            return (
                                <code
                                    className="bg-muted text-foreground px-1.5 py-0.5 rounded text-sm font-mono border border-border" {...props}>
                                    {children}
                                </code>
                            );
                        }
                        return (
                            <code
                                className={cn("block bg-muted text-foreground p-4 rounded-lg border border-border font-mono text-sm overflow-x-auto", className)} {...props}>
                                {children}
                            </code>
                        );
                    },
                    pre: ({children}) => (
                        <pre
                            className="bg-muted text-foreground p-4 rounded-lg border border-border font-mono text-sm overflow-x-auto mb-4">
                            {children}
                        </pre>
                    ),
                    blockquote: ({children}) => (
                        <blockquote
                            className="border-l-4 border-primary pl-4 py-2 my-4 bg-muted/50 text-foreground italic">
                            {children}
                        </blockquote>
                    ),
                    ul: ({children}) => (
                        <ul className="list-disc list-inside space-y-1 mb-4 text-foreground pl-4">
                            {children}
                        </ul>
                    ),
                    ol: ({children}) => (
                        <ol className="list-decimal list-inside space-y-1 mb-4 text-foreground pl-4">
                            {children}
                        </ol>
                    ),
                    li: ({children}) => (
                        <li className="text-foreground leading-relaxed">
                            {children}
                        </li>
                    ),
                    a: ({href, children}) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
                        >
                            {children}
                        </a>
                    ),
                    strong: ({children}) => (
                        <strong className="font-bold text-foreground">
                            {children}
                        </strong>
                    ),
                    em: ({children}) => (
                        <em className="italic text-foreground">
                            {children}
                        </em>
                    ),
                    hr: () => (
                        <hr className="border-t border-border my-6"/>
                    ),
                    table: ({children}) => (
                        <div className="overflow-x-auto mb-4">
                            <table className="min-w-full border border-border rounded-lg">
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({children}) => (
                        <thead className="bg-muted">
                        {children}
                        </thead>
                    ),
                    tbody: ({children}) => (
                        <tbody className="bg-background">
                        {children}
                        </tbody>
                    ),
                    tr: ({children}) => (
                        <tr className="border-b border-border">
                            {children}
                        </tr>
                    ),
                    th: ({children}) => (
                        <th className="px-4 py-2 text-left font-semibold text-foreground border-r border-border last:border-r-0">
                            {children}
                        </th>
                    ),
                    td: ({children}) => (
                        <td className="px-4 py-2 text-foreground border-r border-border last:border-r-0">
                            {children}
                        </td>
                    ),
                    del: ({children}) => (
                        <del className="line-through text-muted-foreground">
                            {children}
                        </del>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};