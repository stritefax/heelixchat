import {type FC} from "react";
import {KeyboardIcon} from "@heelix-app/design/icons/KeyboardIcon";
import {BookIcon} from "@heelix-app/design/icons/BookIcon";

type DisplayKeyboardActivityProps = {
    keypress_count: number;
};
export const DisplayKeyboardActivity: FC<DisplayKeyboardActivityProps> = ({keypress_count}) => {
    if (keypress_count > 0) {
        return <>
           <KeyboardIcon></KeyboardIcon>
        </>
    }
    return <BookIcon></BookIcon>
};
