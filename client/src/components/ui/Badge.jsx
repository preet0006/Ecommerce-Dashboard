export default function Badge({ tone = 'ok', children }) {
  const cls = tone === 'warn' ? 'badge-warn' : tone === 'danger' ? 'badge-danger' : 'badge-ok';
  return <span className={cls}>{children}</span>;
}
