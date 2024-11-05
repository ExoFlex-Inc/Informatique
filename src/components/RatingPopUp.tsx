import {
  Dialog,
  DialogTitle,
  Rating,
  type IconContainerProps,
  DialogContent,
} from "@mui/material";
import { styled } from "@mui/material";
import SentimentVeryDissatisfiedIcon from "@mui/icons-material/SentimentVeryDissatisfied";
import SentimentDissatisfiedIcon from "@mui/icons-material/SentimentDissatisfied";
import SentimentSatisfiedIcon from "@mui/icons-material/SentimentSatisfied";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAltOutlined";
import SentimentVerySatisfiedIcon from "@mui/icons-material/SentimentVerySatisfied";

interface RatingPopUpProps {
  openDialogPainScale: boolean;
  setOpenDialogPainScale: React.Dispatch<React.SetStateAction<boolean>>;
  setPainScale: React.Dispatch<React.SetStateAction<number>>;
}

const StyledRating = styled(Rating)(({ theme }) => ({
  "& .MuiRating-iconEmpty .MuiSvgIcon-root": {
    color: theme.palette.action.disabled,
  },
}));

const RatingPopUp: React.FC<RatingPopUpProps> = ({
  openDialogPainScale,
  setOpenDialogPainScale,
  setPainScale,
}) => {
  const customIcons: {
    [index: string]: {
      icon: React.ReactElement<any>;
      label: string;
    };
  } = {
    1: {
      icon: (
        <SentimentVerySatisfiedIcon sx={{ fontSize: 30 }} color="success" />
      ),
      label: "Very Satisfied",
    },
    2: {
      icon: <SentimentSatisfiedAltIcon sx={{ fontSize: 30 }} color="success" />,
      label: "Satisfied",
    },
    3: {
      icon: <SentimentSatisfiedIcon sx={{ fontSize: 30 }} color="warning" />,
      label: "Neutral",
    },
    4: {
      icon: <SentimentDissatisfiedIcon sx={{ fontSize: 30 }} color="error" />,
      label: "Dissatisfied",
    },
    5: {
      icon: (
        <SentimentVeryDissatisfiedIcon sx={{ fontSize: 30 }} color="error" />
      ),
      label: "Very Dissatisfied",
    },
  };

  function onRatingChange(target: any) {
    setOpenDialogPainScale(false);
    setPainScale(target.value);
  }

  function IconContainer(props: IconContainerProps) {
    const { value, ...other } = props;
    return <span {...other}>{customIcons[value]?.icon}</span>;
  }

  return (
    <Dialog open={openDialogPainScale}>
      <DialogTitle>
        Rate the pain scale from your exercise session from 1 to 5
      </DialogTitle>
      <DialogContent
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        <StyledRating
          IconContainerComponent={IconContainer}
          highlightSelectedOnly
          onChange={({ target }) => onRatingChange(target)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default RatingPopUp;
