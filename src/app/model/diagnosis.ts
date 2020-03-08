export class Diagnosis {

    // The number of symptoms that matched the search.
    count: number;

    // The name of the pathology.
    name: string;

    // The frequency with which the symptoms are associated to the pathology.
    frequency: number;

    // Key-value pairs of ICD10CM codes associated to their respective descriptions.
    symptoms: {};
}
