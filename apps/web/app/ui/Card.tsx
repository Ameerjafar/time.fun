import { Star } from "lucide-react";
import Image from "next/image";
interface CardType {
  name: string;
  rating: number;
  description: string;
  price: number;
  imageUrl: string;
}

export const Card = ({
  name,
  rating,
  description,
  price,
  imageUrl,
}: CardType) => {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="h-92 w-72  hover:border border-1 hover:border-secondary p-2 bg-primary text-primaryText rounded-3xl">
        <div className="rounded-3xl overflow-hidden block">
          <img
            className="hover:scale-110 ease-in duration-150 h-60"
            src={imageUrl}
            alt="image not found"
          ></img>
        </div>
        <div className="">
          <div className="flex justify-between px-2 font-semibold mt-2 text-xl">
            <div className="">{name}</div>
            <div className="flex space-x-3">
              <Star className="mt-1" />
              <div className="">{rating}</div>
            </div>
          </div>
          <div className="px-2 mt-2 text-gray-300">{description}</div>
          <div className="px-2 mt-8">{price}/min</div>
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity ">
            <button className="">Buy Time</button>
          </div>
        </div>
      </div>
    </div>
  );
};
