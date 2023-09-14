import React, { useEffect } from "react";
import { useState } from "react";
import { UploadModal } from "./UploadModal";
import { BsFileArrowUp } from "react-icons/bs";
import { api } from "~/utils/api";

export const UploadCard: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  const { data: myFiles, isLoading } = api.file.getAllUserFiles.useQuery();

  useEffect(() => {
    if (myFiles?.length === 0 && !isLoading) {
      setShowModal(true);
    }
  }, [myFiles, isLoading]);

  return (
    <>
      <div
        className="flex h-[200px] w-[170px] cursor-pointer items-center justify-center border-[1px] border-dashed border-gray-400 bg-white text-gray-200 transition hover:text-gray-300"
        onClick={() => setShowModal(true)}
      >
        <BsFileArrowUp size={70} className="mx-auto my-8" />
      </div>

      {showModal && <UploadModal onClose={() => setShowModal(false)} />}
    </>
  );
};
