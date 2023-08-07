const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('../errors/api-error');

/**
 * Payment Type Schema
 * @private
 */
const paymentTypeSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
    },
    deadline: {
        type: Date,
        required: true,
    },
}, {
    timestamps: true,
});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */
paymentTypeSchema.method({
    transform() {
        const transformed = {};
        const fields = ['id', 'type', 'deadline', 'createdAt'];

        fields.forEach((field) => {
            transformed[field] = this[field];
        });

        return transformed;
    },
});

/**
 * Statics
 */
paymentTypeSchema.statics = {

    /**
     * Get payment types.
     *
     * @param {ObjectId} id - The objectId of the payment type.
     * @returns {Promise<PaymentType, APIError>}
     */
    async get(id) {
        let paymentType;

        if (mongoose.Types.ObjectId.isValid(id)) {
            paymentType = await this.findById(id).exec();
        }
        if (paymentType) {
            return paymentType;
        }

        throw new APIError({
            message: 'The payment type does not exist',
            status: httpStatus.NOT_FOUND,
        });
    },

    /**
     * List of payment types in descending order of 'createdAt' timestamp.
     *
     * @param {number} skip - Number of payment types to be skipped.
     * @param {number} limit - Limit number of payment types to be returned.
     * @returns {Promise<PaymentType[]>}
     */
    list({
        page = 1, perPage = 30,
    }) {
        return this.find()
            .sort({ createdAt: -1 })
            .skip(perPage * (page - 1))
            .limit(perPage)
            .exec();
    },

    async listDownload({
        start,
        end,
        deadline,
    }) {
        let formData = {}

        if (deadline) {
            formData.deadline = new Date(deadline)
        }

        // console.log(deadline)

        let result;

        if (start && end) {
            result = await this.find({
                createdAt: { $gte: new Date(start), $lte: new Date(end) },
                ...formData
            });
        } else if (!start && end) {
            result = await this.find({
                createdAt: { $lte: new Date(end) },
                ...formData
            });
        } else if (!end && start) {
            result = await this.find({
                createdAt: { $gte: new Date(start) },
                ...formData
            });
        } else {
            result = this.find({ ...formData });
        }

        return result;
    },

    async filteredCount({
        start, end, type
    }) {
        let result;

        if (start && end) {
            result = await this.find({
                createdAt: { $gte: new Date(start), $lte: new Date(end) },
            });
        } else if (!start && end) {
            result = await this.find({
                createdAt: { $lte: new Date(end) },
            });
        } else if (!end && start) {
            result = await this.find({
                createdAt: { $gte: new Date(start) },
            });
        } else {
            result = await this.find();
        }

        const values = [...new Set(result.map(item => item[type]))];

        const valueCounts = {};
        result.forEach(item => {
            const value = item[type];
            if (value !== undefined) {
                if (valueCounts[value]) {
                    valueCounts[value]++;
                } else {
                    valueCounts[value] = 1;
                }
            }
        });

        const chartData = values.map(value => ({
            value,
            count: valueCounts[value] || 0
        }));

        return chartData;
    },
};

/**
 * @typedef PaymentType
 */
module.exports = mongoose.model('PaymentType', paymentTypeSchema);
