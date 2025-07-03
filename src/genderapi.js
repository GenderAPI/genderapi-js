class GenderAPI {
    constructor(apiKey, baseUrl = "https://api.genderapi.io") {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }

    async getGenderByName(name, country = null, askToAI = false, forceToGenderize = false) {
        return await this._postRequest("/api", {
            name,
            country,
            askToAI,
            forceToGenderize
        });
    }

    async getGenderByEmail(email, country = null, askToAI = false) {
        return await this._postRequest("/api/email", {
            email,
            country,
            askToAI
        });
    }

    async getGenderByUsername(username, country = null, askToAI = false, forceToGenderize = false) {
        return await this._postRequest("/api/username", {
            username,
            country,
            askToAI,
            forceToGenderize
        });
    }

    async _postRequest(endpoint, payload) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json"
        };

        const body = JSON.stringify(
            Object.fromEntries(
                Object.entries(payload).filter(([_, v]) => v !== null)
            )
        );

        const response = await fetch(url, {
            method: "POST",
            headers,
            body
        });

        if (response.status === 500) {
            throw new Error(`Server Error: ${response.statusText}`);
        }

        if (response.status !== 200) {
            const errorJson = await response.json().catch(() => null);
            if (errorJson) {
                throw new Error(`API Error ${response.status}: ${JSON.stringify(errorJson)}`);
            } else {
                throw new Error(`API Error ${response.status}: ${response.statusText}`);
            }
        }

        return await response.json();
    }
}

// ESM Export
export default GenderAPI;

// CommonJS Export
if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
    module.exports = GenderAPI;
}
