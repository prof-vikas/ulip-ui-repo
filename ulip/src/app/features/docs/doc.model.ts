export interface DocField {
  name: string;
  type: string;
  required?: boolean;
  description: string;
  example?: string;
}

export interface DocFieldGroup {
  title: string;
  /** JSON path of the object inside the response, e.g. response[0].response.dldetobj[0].dlobj */
  path: string;
  description?: string;
  fields: DocField[];
}

export interface DocStatusCode {
  code: string;
  meaning: string;
  action: string;
  quota: string;
}

export interface DocNote {
  title: string;
  body: string[];
  tone?: 'info' | 'warning';
}

/** Everything the reference page renders for one API. */
export interface ApiDoc {
  slug: string;
  title: string;
  apiId: number;
  category: string;
  summary: string;
  overview: string[];
  method: 'GET' | 'POST';
  path: string;
  portalPath: string;
  request: {
    description: string;
    fields: DocField[];
    example: Record<string, unknown>;
  };
  /** Where the useful data sits in the body, e.g. ['response', 0, 'response', 'dldetobj', 0]. */
  recordPath: (string | number)[];
  /** A field inside the record the code samples print, e.g. ['dlobj', 'dlStatus']. */
  printField: (string | number)[];
  /** One line under "Response" saying what the record is. */
  recordNote: string;
  envelope: DocField[];
  fieldGroups: DocFieldGroup[];
  statusCodes: DocStatusCode[];
  notes: DocNote[];
  sampleResponse: unknown;
  errorSample: unknown;
}
