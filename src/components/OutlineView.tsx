import { api } from "~/utils/api";

interface OutlineViewProps {
  outlineUid: string;
}

export const OutlineView: React.FC<OutlineViewProps> = ({ outlineUid }) => {
  const { data: outline } = api.file.getOutline.useQuery(outlineUid);

  return (
    <div className="relative flex h-full flex-col gap-6">
      <span className="text-xl font-light">
        {!outline ? "Loading..." : "Outline"}
      </span>

      {outline && (
        <div className="whitespace-pre-line rounded-md bg-gray-300 p-2">
          {outline.text}
        </div>
      )}
    </div>
  );
};
