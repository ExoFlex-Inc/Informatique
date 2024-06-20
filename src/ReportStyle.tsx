import { StyleSheet } from "@react-pdf/renderer";
export const ReportStyle = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#E4E4E4",
    alignItems: "center",
    textAlign: "center",
  },
  logo: {
    width: 140,
    height: 93,
  },
  title: {
    position: "absolute",
    justifyContent: "center",
    flexDirection: "row",
    width: "100%",
  },
  creationInformation: {
    flexDirection: "column",
    fontSize: 12,
    marginRight: "10px",
  },
  topBar: {
    // position: 'relative',
    justifyContent: "space-between",
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderBottom: "1px",
    marginBottom: "8px",
  },

  dataInfo: {
    justifyContent: "space-between",
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  table: {
    margin: "8px",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableColHeader: {
    width: "10%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: "#f0f0f0",
  },
  tableCol: {
    width: "10%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCellHeader: {
    margin: 5,
    fontSize: 8,
    fontWeight: "bold",
  },
  tableCell: {
    margin: 5,
    fontSize: 8,
  },
});
