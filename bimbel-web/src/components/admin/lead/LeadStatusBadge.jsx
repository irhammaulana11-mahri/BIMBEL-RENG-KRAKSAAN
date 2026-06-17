export default function LeadStatusBadge({
  status,
}) {
  const styles = {
    NEW: "bg-blue-100 text-blue-700",

    CONTACTED:
      "bg-yellow-100 text-yellow-700",

    FOLLOW_UP:
      "bg-orange-100 text-orange-700",

    REGISTERED:
      "bg-green-100 text-green-700",

    CLOSED:
      "bg-gray-100 text-gray-700",
  };

  return (
    <span
      className={`
        px-3 py-1
        rounded-full
        text-sm
        ${styles[status]}
      `}
    >
      {status}
    </span>
  );
}