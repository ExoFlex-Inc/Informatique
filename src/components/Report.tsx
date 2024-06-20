import { Document, Page, Text, View, Image } from "@react-pdf/renderer";
import { ReportStyle } from "../ReportStyle.tsx";
import { DateRange } from "rsuite/esm/DateRangePicker/types.js";
import { dataStructure } from "../pages/Activity.tsx";
import { useEffect } from "react";
import LineChart from "./LineChart.tsx";

interface ReportProps {
    selectedPatient: any[] | undefined;
    date: DateRange | null;
    data: dataStructure[];
    chartImage1: string;
}

const Report: React.FC<ReportProps> = ({selectedPatient, date, data, chartImage1}) => {
    useEffect(() => {
        console.log("data1",data);
        // <LineChart  />

    }, [])
    return (
        <Document>
            <Page size="A4" style={ReportStyle.page}>
            <View style={ReportStyle.topBar}>
                <View style={ReportStyle.logo}>
                <Image src={"../../assets/logo.png"} ></Image>
                </View>
                <View style={ReportStyle.title}>
                <Text>Report</Text>
                </View>
                <View style={ReportStyle.creationInformation}>
                <Text>Reporter: </Text>
                <Text>Date: </Text>
                </View>
            </View>
            <View style={ReportStyle.dataInfo}>
                <Text style={{marginLeft: '8px'}}>Patient Data:</Text>
                <View style={ReportStyle.creationInformation}>
                <Text>Name of patient: {selectedPatient?.[0].username} {selectedPatient?.[0].lastname}</Text>
                <Text>Beginning Date: {date?.[0].toISOString().split('T')[0]} </Text>
                <Text>Ending Date: {date?.[1].toISOString().split('T')[0]} </Text>
                </View>
            </View>
            <View style={ReportStyle.table}>
                <View style={ReportStyle.tableRow}>
                <View style={ReportStyle.tableColHeader}>
                    <Text style={ReportStyle.tableCellHeader}>Date</Text>
                </View>
                <View style={ReportStyle.tableColHeader}>
                    <Text style={ReportStyle.tableCellHeader}>Average force Nm</Text>
                </View>
                <View style={ReportStyle.tableColHeader}>
                    <Text style={ReportStyle.tableCellHeader}>Maximum force Nm</Text>
                </View>
                <View style={ReportStyle.tableColHeader}>
                    <Text style={ReportStyle.tableCellHeader}>Target angle degrees</Text>
                </View>
                <View style={ReportStyle.tableColHeader}>
                    <Text style={ReportStyle.tableCellHeader}>Maximum angle degrees</Text>
                </View>
                <View style={ReportStyle.tableColHeader}>
                    <Text style={ReportStyle.tableCellHeader}>Repetitions done</Text>
                </View>
                <View style={ReportStyle.tableColHeader}>
                    <Text style={ReportStyle.tableCellHeader}>Repetitions success rate in %</Text>
                </View>
                <View style={ReportStyle.tableColHeader}>
                    <Text style={ReportStyle.tableCellHeader}>Predicted total time in seconds</Text>
                </View>
                <View style={ReportStyle.tableColHeader}>
                    <Text style={ReportStyle.tableCellHeader}>Actual total time in seconds</Text>
                </View>
                <View style={ReportStyle.tableColHeader}>
                    <Text style={ReportStyle.tableCellHeader}>Pain scale 1 to 10</Text>
                </View>
                </View>
                {data.map((row: any, rowIndex) => (
                <View style={ReportStyle.tableRow} key={rowIndex}>
                    <View style={ReportStyle.tableCol}>
                    <Text style={ReportStyle.tableCell}>{row.date.split('T')[0]}</Text>
                    </View>
                    <View style={ReportStyle.tableCol}>
                    <Text style={ReportStyle.tableCell}>{row.force_avg}</Text>
                    </View>
                    <View style={ReportStyle.tableCol}>
                    <Text style={ReportStyle.tableCell}>{row.force_max}</Text>
                    </View>
                    <View style={ReportStyle.tableCol}>
                    <Text style={ReportStyle.tableCell}>{row.angle_target}</Text>
                    </View>
                    <View style={ReportStyle.tableCol}>
                    <Text style={ReportStyle.tableCell}>{row.angle_max}</Text>
                    </View>
                    <View style={ReportStyle.tableCol}>
                    <Text style={ReportStyle.tableCell}>{row.repetitions_done}</Text>
                    </View>
                    <View style={ReportStyle.tableCol}>
                    <Text style={ReportStyle.tableCell}>{row.repetitions_success_rate}</Text>
                    </View>
                    <View style={ReportStyle.tableCol}>
                    <Text style={ReportStyle.tableCell}>{row.predicted_total_time}</Text>
                    </View>
                    <View style={ReportStyle.tableCol}>
                    <Text style={ReportStyle.tableCell}>{row.actual_total_time}</Text>
                    </View>
                    <View style={ReportStyle.tableCol}>
                    <Text style={ReportStyle.tableCell}>{row.rated_pain}</Text>
                    </View>
                </View>
                ))}
            </View>

            <Image src={chartImage1}></Image>
            </Page>
        </Document>
    )
}

export default Report;