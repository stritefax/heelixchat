import { atom, useAtom } from "jotai";

type userState = {
  id: string;
  name: string;
  imageUrl: string;
};

const userAtom = atom<userState>({
  id: "1",
  name: "Guest",
  imageUrl: "",
});

export const useUser = () => {
  const [user, setUser] = useAtom(userAtom);

  return { user, setUser };
};
