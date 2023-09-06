import React from "react";
import { useState } from "react";
import { AiFillPlusCircle } from "react-icons/ai";
import { UploadModal } from "./UploadModal";

export const UploadCard: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="flex h-[250px] w-[250px] flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-[#003049] bg-white p-4">
      <div
        className="cursor-pointer opacity-50 transition hover:opacity-100"
        onClick={() => setShowModal(true)}
      >
        <AiFillPlusCircle color="#003049" size={65} />
      </div>

      {showModal && <UploadModal onClose={() => setShowModal(false)} />}
    </div>
  );
};
