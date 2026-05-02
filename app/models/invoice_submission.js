// models/InvoiceSubmission.js
module.exports = (sequelize, DataTypes) => {
  const InvoiceSubmission = sequelize.define("InvoiceSubmission", {
    rfq_number: DataTypes.STRING,
    vendor_id: DataTypes.INTEGER,
    delivery_date: DataTypes.DATE,
    invoice_amount: DataTypes.DECIMAL(12, 2),
    invoice_file: DataTypes.STRING,
    remarks: DataTypes.STRING,
    status: {
      type: DataTypes.STRING,
      defaultValue: "submitted",
    },
  });

  return InvoiceSubmission;
};
