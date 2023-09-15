import { api } from "~/utils/api";
import { AiOutlineCloudDownload } from "react-icons/ai";

interface DownloadFileProps {
  fileKey?: string;
}

export const DownloadFile: React.FC<DownloadFileProps> = ({ fileKey }) => {
  const { data: downloadUrl } = api.file.getDownloadUrl.useQuery(
    {
      key: fileKey ?? "",
    },
    {
      enabled: !!fileKey,
      staleTime: Infinity,
    },
  );

  return (
    <a
      type="button"
      href={downloadUrl}
      download
      className="inline-flex w-full justify-center rounded-lg border-2 border-[#003049] bg-white px-5 py-2.5 text-center text-sm font-medium text-[#003049] focus:outline-none focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900"
    >
      <AiOutlineCloudDownload size={20} className="mr-2" />
      Download
    </a>
  );
};
