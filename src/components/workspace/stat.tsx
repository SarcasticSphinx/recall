import { Icon } from "@/components/icon";
export function Stat({
  icon,
  value,
  label,
  detail,
}: {
  icon: string;
  value: number;
  label: string;
  detail: string;
}) {
  return (
    <div className="stat">
      <span className="stat-icon">
        <Icon name={icon} size={21} />
      </span>
      <div>
        <div className="stat-top">
          <strong>{value}</strong>
          <span>{label}</span>
        </div>
        <p>{detail}</p>
      </div>
    </div>
  );
}
