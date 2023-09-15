import React, { useEffect, useMemo } from "react";
import { useState } from "react";
import { UploadModal } from "./UploadModal";
import { BsFileArrowUp } from "react-icons/bs";
import { api } from "~/utils/api";
import { useIsMobile } from "~/hooks/useIsMobile";
import Image from "next/image";

export const UploadCard: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showStartHere, setShowStartHere] = useState(false);

  const { data: myFiles, isLoading } = api.file.getAllUserFiles.useQuery();

  useEffect(() => {
    if (myFiles?.length === 0 && !isLoading) {
      setShowStartHere(true);
    }
  }, [myFiles, isLoading]);

  const isMobile = useIsMobile();

  const sizeStyle = useMemo(() => {
    if (isMobile) {
      if (showStartHere) return "h-[200px] w-[50vw]";
      return "h-[200px] w-[calc(50%-10px)]";
    }
    return "h-[200px] w-[170px]";
  }, [isMobile, showStartHere]);

  return (
    <div className="relative">
      <div
        className={`flex flex-col ${sizeStyle} cursor-pointer items-center justify-center border-[1px] border-dashed border-gray-400 bg-white text-gray-200 transition hover:text-gray-300`}
        onClick={() => setShowModal(true)}
      >
        <BsFileArrowUp size={70} className="mx-auto mb-2 mt-8" />

        <span className="text-sm uppercase">Upload File</span>
      </div>

      {showModal && <UploadModal onClose={() => setShowModal(false)} />}

      {showStartHere && (
        <div className="absolute right-[-150px] top-0">
          <Image
            src="https://public-learn-ai-m93.s3.amazonaws.com/start-here.png"
            width={150}
            height={150}
            alt="Start Here"
            objectFit="contain"
          />
        </div>
      )}
    </div>
  );
};
