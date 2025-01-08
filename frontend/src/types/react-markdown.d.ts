declare module 'react-markdown' {
  import { ReactNode } from 'react';

  interface ReactMarkdownProps {
    children: string;
    remarkPlugins?: any[];
    className?: string;
    components?: {
      [key: string]: (props: any) => ReactNode;
    };
  }

  export default function ReactMarkdown(props: ReactMarkdownProps): JSX.Element;
}

declare module 'remark-gfm' {
  const remarkGfm: any;
  export default remarkGfm;
} 