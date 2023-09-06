import React from "react";
import { useState } from "react";
import { UploadModal } from "./UploadModal";
import { BsFileArrowUp } from "react-icons/bs";

export const UploadCard: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div
        className="flex h-[200px] w-[190px] cursor-pointer items-center justify-center border-2 border-dashed border-gray-400 bg-white text-gray-200 transition hover:text-gray-300"
        onClick={() => setShowModal(true)}
      >
        <BsFileArrowUp size={70} className="mx-auto my-8" />
      </div>

      {showModal && <UploadModal onClose={() => setShowModal(false)} />}
    </>
  );
};
