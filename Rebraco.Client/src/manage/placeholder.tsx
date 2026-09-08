import { useLocation } from "react-router";

export default function PlaceholderPage() {
  const { pathname } = useLocation();
  const section = pathname.split("/").pop() || "Section";
  const title = section.charAt(0).toUpperCase() + section.slice(1);

  return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">🏗</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-500">This section is coming soon.</p>
    </div>
  );
}
