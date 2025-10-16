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
      <div className="h-92 w-72 hover:border border-1 hover:border-secondary p-2 bg-primary text-primaryText rounded-3xl group">
        <div className="relative">
          <div className="rounded-3xl overflow-hidden block">
            <img
              className="group-hover:scale-110 ease-in duration-150 h-60 w-full object-cover"
              src={imageUrl}
              alt="image not found"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 rounded-3xl" />
          </div>
          <div className="relative transition-transform duration-300 group-hover:-translate-y-8 rounded-2xl shadow-[0_-10px_20px_0_rgba(0,0,0,0.3)] overflow-hidden">
            <div className="px-2 pt-4 pb-4">
              <div className="flex justify-between font-semibold text-xl">
                <div className="">{name}</div>
                <div className="flex space-x-3">
                  <Star className="mt-1" />
                  <div className="">{rating}</div>
                </div>
              </div>
              <div className="mt-2 text-gray-300">{description}</div>
              <div className="mt-8">{price}/min</div>
            </div>
            
            {/* Button - hidden by default, shows on hover, no gap */}
          </div>
          <div className="opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              <button className="bg-secondary w-full text-black/80 text-xl font-bold p-2 rounded-xl">
                Buy Time
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};