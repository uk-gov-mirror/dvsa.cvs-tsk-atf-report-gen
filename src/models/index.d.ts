declare enum StationType {
    ATF = "atf",
    GVTS = "gvts",
    HQ = "hq"
}

interface IS3Config {
    endpoint: string;
}

interface IMOTConfig {
    endpoint: string;
    documentNames: {
        vt20: "VT20.pdf";
        vt20w: "VT20W.pdf";
        vt30: "VT30.pdf";
        vt30w: "VT30W.pdf";
        vt32ve: "VT32VE.pdf";
        vt32vew: "VT32VEW.pdf";
        prs: "PRS.pdf";
        prsw: "PRSW.pdf";
        ct20: "CT20.pdf";
        ct30: "CT30.pdf";
        vtp20: "VTP20.pdf";
        vtp30: "VTP30.pdf";
        psv_prs: "PSV_PRS.pdf";
        vtg5: "VTG5.pdf";
        vtg5a: "VTG5A.pdf";
    };
    api_key: string;
}

interface IActivity {
    id: string;
    activityType: "visit" | "wait";
    testStationName: string;
    testStationPNumber: string;
    testStationEmail: string;
    testStationType: StationType;
    testerName: string;
    testerStaffId: string;
    startTime: string;
    endTime: string;
}

interface IInvokeConfig {
    params: { apiVersion: string; endpoint?: string; };
    functions: { testResults: { name: string }, testStations: { name: string; mock: string } };
}

export {IS3Config, IActivity, IInvokeConfig, IMOTConfig};
