class GenderAPI {
    constructor(apiKey, baseUrl = "https://api.genderapi.io") {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }

    async getGenderByName({name, country = null, askToAI = false, forceToGenderize = false}) {
        if(typeof name !== "string" || !name.trim()) {
            return {status:false,errno: 91, errmsg: "Missing name parameter on your request."};
        }

        return await this._postRequest("/api", {
            name,
            country,
            askToAI,
            forceToGenderize
        });
    }

    async getGenderByEmail(email, country = null, askToAI = false) {
        if(typeof email !== "string" || !email.trim()) {
            return {status:false,errno: 91, errmsg: "Missing email parameter on your request."};
        }
        return await this._postRequest("/api/email", {
            email,
            country,
            askToAI
        });
    }

    async getGenderByUsername(username, country = null, askToAI = false, forceToGenderize = false) {
        if (typeof username !== "string" || !username.trim()) {
            return {status:false,errno: 91, errmsg: "Missing username parameter on your request."};
        }
        return await this._postRequest("/api/username", {
            username,
            country,
            askToAI,
            forceToGenderize
        });
    }

    /**
     * Analyze gender for multiple names (up to 100) in one request.
     *
     * @param {Array} namesData - Array of objects, each object:
     *                            { name: String, country?: String, id?: String|Number }
     * @returns {Promise<Object>} API JSON response
     */
    async getGenderByNameBulk(namesData) {
        if (!Array.isArray(namesData) || namesData.length === 0) {
            return {
                status: false,
                errno: 91,
                errmsg: "Missing or invalid names data for getGenderByNameBulk request."
            };
        }

        if (namesData.length > 100) {
            return {
                status: false,
                errno: 92,
                errmsg: "getGenderByNameBulk request cannot exceed 100 names."
            };
        }

        for (const obj of namesData) {
            if (typeof obj !== "object" || typeof obj.name !== "string" || !obj.name.trim()) {
                return {
                    status: false,
                    errno: 93,
                    errmsg: "Each item in getGenderByNameBulk request must include a valid name string."
                };
            }
        }

        const payload = { data: namesData };

        return await this._postRequest("/api/name/multi/country", payload);
    }

    /**
     * Analyze gender for multiple emails (up to 50) in one request.
     *
     * @param {Array} emailsData - Array of objects, each object:
     *                             { email: String, country?: String, id?: String|Number }
     * @returns {Promise<Object>} API JSON response
     */
    async getGenderByEmailBulk(emailsData) {
        if (!Array.isArray(emailsData) || emailsData.length === 0) {
            return {
                status: false,
                errno: 91,
                errmsg: "Missing or invalid emails data for getGenderByEmailBulk request."
            };
        }

        if (emailsData.length > 50) {
            return {
                status: false,
                errno: 92,
                errmsg: "getGenderByEmailBulk request cannot exceed 50 emails."
            };
        }

        for (const obj of emailsData) {
            if (typeof obj !== "object" || typeof obj.email !== "string" || !obj.email.trim()) {
                return {
                    status: false,
                    errno: 93,
                    errmsg: "Each item in getGenderByEmailBulk request must include a valid email string."
                };
            }
        }

        const payload = { data: emailsData };

        return await this._postRequest("/api/email/multi/country", payload);
    }

    /**
     * Analyze gender for multiple usernames (up to 50) in one request.
     *
     * @param {Array} usernamesData - Array of objects, each object:
     *                                { username: String, country?: String, id?: String|Number }
     * @returns {Promise<Object>} API JSON response
     */
    async getGenderByUsernameBulk(usernamesData) {
        if (!Array.isArray(usernamesData) || usernamesData.length === 0) {
            return {
                status: false,
                errno: 91,
                errmsg: "Missing or invalid usernames data for getGenderByUsernameBulk request."
            };
        }

        if (usernamesData.length > 50) {
            return {
                status: false,
                errno: 92,
                errmsg: "getGenderByUsernameBulk request cannot exceed 50 usernames."
            };
        }

        for (const obj of usernamesData) {
            if (typeof obj !== "object" || typeof obj.username !== "string" || !obj.username.trim()) {
                return {
                    status: false,
                    errno: 93,
                    errmsg: "Each item in getGenderByUsernameBulk request must include a valid username string."
                };
            }
        }

        const payload = { data: usernamesData };

        return await this._postRequest("/api/username/multi/country", payload);
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

        if (response.status === 500 || response.status === 502 || response.status === 503 || response.status === 504 || response.status === 408) {
            throw new Error(`Server Error: ${response.statusText}`);
        }

        try {
            return await response.json()
        }catch (e) {
            throw new Error(`API Error ${response.status}: ${JSON.stringify(e)}`);
        }

    }
}

// ESM Export
export default GenderAPI;

// CommonJS Export
if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
    module.exports = GenderAPI;
}
