
import moment from 'moment';
import img from '../../../images/doc/doctor 3.jpg';
import { Link } from 'react-router-dom';
import './BookingCheckout.css';

const CheckoutPage = ({
    handleChange,
    selectValue,
    isCheck,
    setIsChecked,
    data,
    selectedDate,
    selectTime
}) => {
    const {
        nameOnCard,
        cardNumber,
        expiredMonth,
        cardExpiredYear,
        cvv,
        paymentType,
        paymentMethod
    } = selectValue;

    const isCashPayment = paymentType === 'cash';

    const handleCheck = () => {
        setIsChecked(!isCheck);
    };

    const price = Number(data?.price) || 500;
    const vat = (15 / 100) * price;
    const bookingFee = 10;
    const total = price + 100 + vat;

    return (
        <div className="container mt-5">
            <div className="row">

                {/* PAYMENT SECTION */}
                <div className="col-md-7">
                    <div
                        className="rounded p-3"
                        style={{ background: 'var(--surface-2)' }}
                    >

                        <h5 className="mb-3">Select Payment Type</h5>

                        <div className="row">

                            {/* CREDIT CARD */}
                            <div className="col-md-6 mb-3">
                                <label className="payment-radio">
                                    <input
                                        type="radio"
                                        name="paymentType"
                                        value="creditCard"
                                        checked={paymentType === 'creditCard'}
                                        onChange={handleChange}
                                    />
                                    <span className="ms-2">
                                        Credit Card
                                    </span>
                                </label>
                            </div>

                            {/* CASH */}
                            <div className="col-md-6 mb-3">
                                <label className="payment-radio">
                                    <input
                                        type="radio"
                                        name="paymentType"
                                        value="cash"
                                        checked={isCashPayment}
                                        onChange={handleChange}
                                    />
                                    <span className="ms-2">
                                        Cash
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* CASH PAYMENT MESSAGE */}
                        {isCashPayment ? (
                            <div
                                className="alert alert-success mt-2"
                                role="alert"
                            >
                                <strong>Cash Payment Selected!</strong>
                                <p className="mb-0 mt-1">
                                    You can confirm your appointment directly.
                                    Payment will be made at the clinic.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* CARD DETAILS */}
                                <h6 className="mb-3 mt-2">
                                    Card Information
                                </h6>

                                <div className="row">

                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="card_name">
                                            Name on Card
                                        </label>
                                        <input
                                            className="form-control"
                                            id="card_name"
                                            value={nameOnCard || ''}
                                            type="text"
                                            onChange={handleChange}
                                            name="nameOnCard"
                                        />
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="card_number">
                                            Card Number
                                        </label>
                                        <input
                                            className="form-control"
                                            id="card_number"
                                            value={cardNumber || ''}
                                            placeholder="Card Number"
                                            type="text"
                                            inputMode="numeric"
                                            onChange={handleChange}
                                            name="cardNumber"
                                        />
                                    </div>

                                    <div className="col-md-4 mb-3">
                                        <label htmlFor="expiry_month">
                                            Expiry Month
                                        </label>
                                        <input
                                            className="form-control"
                                            id="expiry_month"
                                            value={expiredMonth || ''}
                                            placeholder="MM"
                                            type="text"
                                            onChange={handleChange}
                                            name="expiredMonth"
                                        />
                                    </div>

                                    <div className="col-md-4 mb-3">
                                        <label htmlFor="expiry_year">
                                            Expiry Year
                                        </label>
                                        <input
                                            className="form-control"
                                            id="expiry_year"
                                            value={cardExpiredYear || ''}
                                            placeholder="YY"
                                            type="text"
                                            onChange={handleChange}
                                            name="cardExpiredYear"
                                        />
                                    </div>

                                    <div className="col-md-4 mb-3">
                                        <label htmlFor="cvv">
                                            CVV
                                        </label>
                                        <input
                                            className="form-control"
                                            id="cvv"
                                            value={cvv || ''}
                                            placeholder="CVV"
                                            type="password"
                                            maxLength={4}
                                            onChange={handleChange}
                                            name="cvv"
                                        />
                                    </div>

                                </div>

                                {/* ONLINE PAYMENT METHODS */}
                                <h6 className="mt-3 mb-3">
                                    Select Payment Method
                                </h6>

                                <div className="d-flex gap-4 mb-3">

                                    <label>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="paypal"
                                            checked={paymentMethod === 'paypal'}
                                            onChange={handleChange}
                                        />
                                        <span className="ms-2">
                                            PayPal
                                        </span>
                                    </label>

                                    <label>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="payoneer"
                                            checked={paymentMethod === 'payoneer'}
                                            onChange={handleChange}
                                        />
                                        <span className="ms-2">
                                            Payoneer
                                        </span>
                                    </label>

                                </div>
                            </>
                        )}

                        {/* TERMS AND CONDITIONS */}
                        <div className="terms-accept mt-3">
                            <div className="custom-checkbox">

                                <input
                                    type="checkbox"
                                    id="terms_accept"
                                    className="me-2"
                                    checked={isCheck}
                                    onChange={handleCheck}
                                />

                                <label htmlFor="terms_accept">
                                    I have read and accept{' '}
                                    <span className="text-primary">
                                        Terms &amp; Conditions
                                    </span>
                                </label>

                            </div>
                        </div>

                    </div>
                </div>

                {/* BOOKING SUMMARY */}
                <div className="col-md-5 col-sm-12">

                    <div
                        className="rounded p-3"
                        style={{ background: 'var(--surface-2)' }}
                    >

                        {data && (
                            <Link
                                to={`/doctors/profile/${data?.id}`}
                                className="booking-doc-img d-flex justify-content-center mb-2"
                            >
                                <img src={img} alt="Doctor" />
                            </Link>
                        )}

                        {data && (
                            <div className="doc-title-info mt-3 mb-3">

                                <h5
                                    className="mt-3 text-center"
                                    style={{
                                        fontSize: '22px',
                                        fontWeight: 700
                                    }}
                                >
                                    Dr. {data?.firstName} {data?.lastName}
                                </h5>

                                <div className="text-center">
                                    <p className="form-text mb-0">
                                        {data?.designation}
                                    </p>

                                    <p className="form-text mb-0">
                                        {data?.clinicAddress}
                                    </p>
                                </div>

                            </div>
                        )}

                        <div className="booking-item-wrap">

                            <ul className="booking-date">
                                <li>
                                    Date
                                    <span>
                                        {moment(selectedDate).format('LL')}
                                    </span>
                                </li>

                                <li>
                                    Time
                                    <span>{selectTime}</span>
                                </li>
                            </ul>

                            <ul className="booking-fee">
                                <li>
                                    Consulting Fee
                                    <span>{price}</span>
                                </li>

                                <li>
                                    Booking Fee
                                    <span>{bookingFee}</span>
                                </li>

                                <li>
                                    GST (Including 15%)
                                    <span>{vat}</span>
                                </li>
                            </ul>

                            <ul className="booking-total">
                                <li className="d-flex justify-content-between">
                                    <span className="fw-bold">
                                        Total
                                    </span>

                                    <span
                                        className="total-cost"
                                        style={{ color: 'var(--primary)' }}
                                    >
                                        {total}
                                    </span>
                                </li>
                            </ul>

                            <p className="text-muted mb-0">
                                Payment Type:{' '}
                                <strong>
                                    {isCashPayment ? 'Cash' : 'Credit Card'}
                                </strong>
                            </p>

                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CheckoutPage;
