import { Diagnosis } from './diagnosis';
import { PersonalHealthInfo } from './personal-health-info';
import { Symptom } from './symptom';

export class DiagnoseResponse {
    phi: PersonalHealthInfo;
    symptoms: Symptom[];
    diagnoses: Diagnosis[];
}
