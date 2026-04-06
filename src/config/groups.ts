export interface DepartmentConfig {
    id: string;      // 例如 'neuro'
    name: string;    // 例如 '神經內科'
}

export interface GroupConfig {
    id: string;      // 例如 '1', '3.1'
    name: string;    // 例如 '神復組', '洗腎室加祥和病房'
    departments: DepartmentConfig[];
}

export const GROUPS: GroupConfig[] = [
    {
        id: '1',
        name: '神復組',
        departments: [
            { id: 'neuro', name: '神神內科' }, // 由於使用者寫「神神」但我會用「神經內科」
            { id: 'rehab', name: '復健科' }
        ]
    },
    {
        id: '2',
        name: '心腎感染組',
        departments: [
            { id: 'cardiology', name: '心臟科' },
            { id: 'nephrology', name: '腎臟科' },
            { id: 'infection', name: '感染科' }
        ]
    },
    {
        id: '3',
        name: '胸腸組',
        departments: [
            { id: 'chest', name: '胸腔科' },
            { id: 'gi', name: '腸胃科' },
            { id: 'endocrine', name: '內分泌' },
            { id: 'rheumatology', name: '風濕免疫' },
            { id: 'skin', name: '皮膚' },
            { id: 'heme', name: '血腫' },
            { id: 'xianghe', name: '祥和' }
        ]
    },
    {
        id: '3.1',
        name: '洗腎室加祥和病房',
        departments: [
            { id: 'dialysis', name: '洗腎室' },
            { id: 'xianghe_ward', name: '祥和病房' }
        ]
    },
    {
        id: '4',
        name: '重症 ICU',
        departments: [
            { id: 'micu', name: 'MICU' },
            { id: 'sicu', name: 'SICU' }
        ]
    },
    {
        id: '5',
        name: 'GU、CRS/GS/BS',
        departments: [
            { id: 'gu', name: '泌尿科' },
            { id: 'crs', name: '大腸直腸外科' },
            { id: 'general_sur', name: '一般外科' },
            { id: 'breast_sur', name: '乳房外科' },
            { id: 'surgery', name: '外科' }
        ]
    },
    {
        id: '6',
        name: '整骨組',
        departments: [
            { id: 'ortho', name: '骨科' },
            { id: 'plastic_sur', name: '整形外科' }
        ]
    },
    {
        id: '7',
        name: 'CV_CVS_NS',
        departments: [
            { id: 'cv', name: '心血管科' },  // Usually CV implies Cardiology but they mentioned CVS and NS
            { id: 'ns', name: '神經外科' },
            { id: 'cvs', name: '胸腔外科' } // Added as requested
        ]
    },
    {
        id: '8',
        name: '五官組',
        departments: [
            { id: 'ent', name: 'ENT' }
        ]
    },
    {
        id: '9',
        name: '婦幼組',
        departments: [
            { id: 'obgyn', name: '婦產科' },
            { id: 'peds', name: '兒科' }
        ]
    }
];

// CV_CVS_NS - 使用者給的細節：神經外科/胸腔外科/心血管外科
// 修改: cv=心血管外科, ns=神經外科, cvs=胸腔外科 
