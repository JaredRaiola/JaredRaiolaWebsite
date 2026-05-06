type Props = {
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
};

export default function Pile({ className, onClick, children }: Props): React.ReactElement {
  return (
    <div className={`sol-pile${className ? ' ' + className : ''}`} onClick={onClick}>
      {children}
    </div>
  );
}
