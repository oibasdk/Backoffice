import { Card } from 'src/components/ui/card';






// import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// import { coy} from 'react-syntax-highlighter/dist/esm/styles/prism';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';

const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    to: '',
    title: 'Iconify Icons',
  },
];

const IconifyIcon = () => {
  return (
    <>
      <BreadcrumbComp title="Iconify Icons" items={BCrumb} />
      <Card className="flex flex-col gap-3">
        <div className="space-y-2">
          <h6>⚙️ Installation</h6>
          <p>To use Tabler icons in your project, install the official React package:</p>
          {/* <SyntaxHighlighter language="typescript" style={coy}> */}
          <pre className="language-typescript">
            <code className="language-typescript">
            {` npm i @iconify-icon/react `}
            </code>
          </pre>
          {/* </SyntaxHighlighter> */}
        </div>
        <div className="space-y-2">
          <h6>🧩 Usage Example</h6>
          <p>Import and use any icon in your components:</p>
          {/* <SyntaxHighlighter language="typescript" style={coy}> */}
          <pre className="language-typescript">
            <code className="language-typescript">
            {`import { Icon } from '@iconify/react';
function MyComponent() {
  return <Icon icon='solar:arrow-right-linear' width='20' height='20' />;
}`}
            </code>
          </pre>
          {/* </SyntaxHighlighter> */}
        </div>
        <div className="space-y-2">
          <h6>🔍 Explore Icons</h6>
          <iframe
            src="https://icon-sets.iconify.design/solar/"
            title="Inline Frame Example"
            width="100%"
            height="650"
          ></iframe>
        </div>
      </Card>
    </>
  );
};

export default IconifyIcon;
