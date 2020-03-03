import * as crypto from 'crypto';
import * as querystring from 'query-string';

export class AwsSignatureV4 {

    private query: {};
    private headers: {};

    constructor(private method: string, private host: string, private pathname: string,
                private region: string, private service: string) {

    }

    // method, host, path, service, payload, options

    private createCanonicalRequest(payload: string) {
        return [
            this.method.toUpperCase(),
            this.pathname,
            this.createCanonicalQueryString(),
            this.createCanonicalHeaders(),
            this.createSignedHeaders(),
            payload
        ].join('\n');
    }

    private createCanonicalQueryString(): string {
        return Object.keys(this.query).sort().map(key => {
            return encodeURIComponent(key) + '=' + encodeURIComponent(this.query[key]);
        }).join('&');
    }

    private createCanonicalHeaders(): string {
        return Object.keys(this.headers).sort().map(name => {
            return name.toLowerCase().trim() + ':' + this.headers[name].toString().trim() + '\n';
        }).join('');
    }

    private createSignedHeaders(): string {
        return Object.keys(this.headers).sort().map(name => {
            return name.toLowerCase().trim();
        }).join(';');
    }

    private createCredentialScope(timestamp: number): string {
        return [this.toDate(timestamp), this.region, this.service, 'aws4_request'].join('/');
    }

    private createStringToSign(timestamp: number, request: string): string {
        return [
            'AWS4-HMAC-SHA256',
            this.toTime(timestamp),
            this.createCredentialScope(timestamp),
            this.hash(request, 'hex')
        ].join('\n');
    }

    private createSignature(stringToSign: string, timestamp: number, secret: string): string {
        const h1 = this.hmac('AWS4' + secret, this.toDate(timestamp));
        const h2 = this.hmac(h1, this.region);
        const h3 = this.hmac(h2, this.service);
        const h4 = this.hmac(h3, 'aws4_request');
        return this.hmac(h4, stringToSign, 'hex');
    }

    createPresignedUrl(payload: string, options: AwsSignatureV4Options) {
        options = options || new AwsSignatureV4Options();
        options.key = options.key || process.env.AWS_ACCESS_KEY_ID;
        options.secret = options.secret || process.env.AWS_SECRET_ACCESS_KEY;
        options.protocol = options.protocol || 'https';
        options.timestamp = options.timestamp || Date.now();
        options.expires = options.expires || 86400;

        this.headers = options.headers || {};
        this.headers['Host'] = this.host;

        const query = (typeof options.query === 'string') ? querystring.parse(options.query) : (options.query || {});
        query['X-Amz-Algorithm'] = 'AWS4-HMAC-SHA256';
        query['X-Amz-Credential'] = options.key + '/' + this.createCredentialScope(options.timestamp);
        query['X-Amz-Date'] = this.toTime(options.timestamp);
        query['X-Amz-Expires'] = options.expires;
        query['X-Amz-SignedHeaders'] = this.createSignedHeaders();
        if (options.sessionToken) {
            query['X-Amz-Security-Token'] = options.sessionToken;
        }

        const canonicalRequest = this.createCanonicalRequest(payload);
        const stringToSign = this.createStringToSign(options.timestamp, canonicalRequest);
        const signature = this.createSignature(stringToSign, options.timestamp, options.secret);
        query['X-Amz-Signature'] = signature;

        return options.protocol + '://' + this.host + this.pathname + '?' + querystring.stringify(query);
    }

    private toTime(timestamp: number): string {
        return new Date(timestamp).toISOString().replace(/[:\-]|\.\d{3}/g, '');
    }

    private toDate(timestamp: number): string {
        return this.toTime(timestamp).substring(0, 8);
    }

    private hmac(key: string, str: string, encoding?: crypto.HexBase64Latin1Encoding): string {
        return crypto.createHmac('sha256', key).update(str, 'utf8').digest(encoding);
    }

    private hash(str: string, encoding?: crypto.HexBase64Latin1Encoding): string {
        return crypto.createHash('sha256').update(str, 'utf8').digest(encoding);
    }
}

export class AwsSignatureV4Options {
    key: string;
    secret: string;
    sessionToken: string;
    protocol: string;
    timestamp: number;
    expires: number;
    headers: {};
    query: {} | string;
}
