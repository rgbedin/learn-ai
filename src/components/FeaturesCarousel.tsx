import React from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import Image from "next/image";

interface FeaturesCardProps {
  imageUrl: string;
  title: string;
}

const FeaturesCard: React.FC<FeaturesCardProps> = ({ imageUrl, title }) => {
  return (
    <div className="rounded-m mb-4 flex flex-col items-center gap-2 border-gray-100 bg-white p-2">
      <div className="flex h-1/3 min-h-[140px] items-center">
        <Image src={imageUrl} height={120} width={120} alt="Upload File" />
      </div>

      <span className="text-center text-sm">{title}</span>
    </div>
  );
};

export const FeaturesCarousel: React.FC = () => {
  return (
    <div className="mb-3 flex gap-1 border-b border-gray-200">
      <FeaturesCard
        imageUrl="https://public-learn-ai-m93.s3.amazonaws.com/img-1.png"
        title="You can upload a photo of any written text."
      />

      <FeaturesCard
        imageUrl="https://public-learn-ai-m93.s3.amazonaws.com/img-2.png"
        title="We also support uploading PDF or DOCX documents."
      />

      <FeaturesCard
        imageUrl="https://public-learn-ai-m93.s3.amazonaws.com/img-3.png"
        title="Do you have a recorded audio file? We support that too!"
      />
    </div>
  );
};
