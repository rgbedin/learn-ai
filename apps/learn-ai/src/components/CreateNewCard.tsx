import { AiOutlineFileAdd } from "react-icons/ai";

interface CreateNew {
  onClick: () => void;
  label: string;
}

export const CreateNew: React.FC<CreateNew> = ({ onClick, label }) => {
  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer items-center gap-4 border-[1px] border-dashed border-gray-500 bg-white p-3 shadow transition hover:bg-gray-100"
    >
      <AiOutlineFileAdd size={28} />
      <span className="text-sm">{label}</span>
    </div>
  );
};
