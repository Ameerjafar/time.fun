import { Star } from "lucide-react";
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
    <div>
      <div className="">
        <img src={imageUrl}></img>
        <div className="flex justify-between ">
          <div>{name}</div>
          <div className="flex space-x-3 text-red-400">
            <Star />
            <div className = ''>{rating}</div>
          </div>
        </div>
        <div>{description}</div>
        <div>{price}</div>
        <button>Buy Time</button>
      </div>
    </div>
  );
};
