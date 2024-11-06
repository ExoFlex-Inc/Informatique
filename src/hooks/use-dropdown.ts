import { useRef, useEffect } from "react";

const isNumberOrNull = (
  state:
    | React.Dispatch<React.SetStateAction<Number | null>>
    | React.Dispatch<React.SetStateAction<boolean>>,
): state is React.Dispatch<React.SetStateAction<Number | null>> => {
  return typeof state !== "boolean";
};

const useDropdown = (
  setOpen:
    | React.Dispatch<React.SetStateAction<Number | null>>
    | React.Dispatch<React.SetStateAction<boolean>>,
) => {
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        if (isNumberOrNull(setOpen)) {
          setOpen(null);
        } else {
          setOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return dropdownRef;
};

export default useDropdown;
