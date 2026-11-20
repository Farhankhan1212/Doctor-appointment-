
import React, { useEffect, useState } from 'react';

import Footer from '../../Shared/Footer/Footer';
import img from '../../../images/doc/doctor 3.jpg';
import './index.css';

import { Link, useNavigate, useParams } from 'react-router-dom';
import { Empty, Button, message, Steps } from 'antd';

import { useGetDoctorQuery } from '../../../redux/api/doctorApi';
import { FaArchway } from 'react-icons/fa';

import { useGetAppointmentTimeQuery } from '../../../redux/api/timeSlotApi';
import moment from 'moment';

import SelectDateAndTime from '../SelectDateAndTime';
import PersonalInformation from '../PersonalInformation';
import CheckoutPage from '../BookingCheckout/CheckoutPage';

import { useCreateAppointmentMutation } from '../../../redux/api/appointmentApi';

import { useDispatch } from 'react-redux';
import { addInvoice } from '../../../redux/feature/invoiceSlice';

import Header from '../../Shared/Header/Header';
import useAuthCheck from '../../../redux/hooks/useAuthCheck';

const DoctorBooking = () => {

    const dispatch = useDispatch();
    const navigation = useNavigate();

    const { doctorId } = useParams();

    const { data: loggedInUser, role } = useAuthCheck();

    // Initial booking values
    const initialValue = {
        paymentMethod: 'paypal',
        paymentType: 'creditCard',

        firstName: '',
        lastName: '',
        email: '',
        phone: '',

        reasonForVisit: '',
        description: '',
        address: '',

        nameOnCard: '',
        cardNumber: '',
        expiredMonth: '',
        cardExpiredYear: '',
        cvv: '',
    };

    const [selectValue, setSelectValue] = useState(initialValue);

    const [current, setCurrent] = useState(0);

    const [selectedDate, setSelectedDate] = useState('');
    const [selectDay, setSelecDay] = useState('');
    const [selectTime, setSelectTime] = useState('');

    const [isCheck, setIsChecked] = useState(false);
    const [patientId, setPatientId] = useState('');

    const [IsdDisable, setIsDisable] = useState(true);
    const [IsConfirmDisable, setIsConfirmDisable] = useState(true);

    // Appointment API
    const [
        createAppointment,
        {
            data: appointmentData,
            isSuccess: createIsSuccess,
            isError: createIsError,
            error: createError,
            isLoading: createIsLoading
        }
    ] = useCreateAppointmentMutation();

    // Doctor API
    const {
        data,
        isLoading,
        isError,
        error
    } = useGetDoctorQuery(doctorId);

    // Available time slots
    const {
        data: time,
        isLoading: dIsLoading,
        isError: dIsError
    } = useGetAppointmentTimeQuery(
        {
            day: selectDay,
            id: doctorId
        },
        {
            skip: !selectDay || !doctorId
        }
    );

    // Handle patient and payment input changes
    const handleChange = (e) => {

        const { name, value } = e.target;

        // Cash selected
        if (name === 'paymentType' && value === 'cash') {

            setSelectValue((previous) => ({
                ...previous,

                paymentType: 'cash',
                paymentMethod: 'cash',

                // Clear card information for cash booking
                nameOnCard: '',
                cardNumber: '',
                expiredMonth: '',
                cardExpiredYear: '',
                cvv: ''
            }));

            return;
        }

        // Credit card selected
        if (name === 'paymentType' && value === 'creditCard') {

            setSelectValue((previous) => ({
                ...previous,

                paymentType: 'creditCard',
                paymentMethod:
                    previous.paymentMethod === 'cash'
                        ? 'paypal'
                        : previous.paymentMethod
            }));

            return;
        }

        setSelectValue((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    // Validate form fields
    useEffect(() => {

        const {
            firstName,
            lastName,
            email,
            phone,
            reasonForVisit,
            nameOnCard,
            cardNumber,
            expiredMonth,
            cardExpiredYear,
            cvv,
            paymentType
        } = selectValue;

        const isPatientInfoEmpty =
            !firstName ||
            !lastName ||
            !email ||
            !phone ||
            !reasonForVisit;

        // Card details are required only for credit card payment
        const isCardInfoEmpty =
            paymentType === 'cash'
                ? false
                : (
                    !nameOnCard ||
                    !cardNumber ||
                    !expiredMonth ||
                    !cardExpiredYear ||
                    !cvv
                );

        setIsDisable(isPatientInfoEmpty);

        setIsConfirmDisable(
            isPatientInfoEmpty ||
            isCardInfoEmpty ||
            !isCheck ||
            !selectedDate ||
            !selectTime
        );

    }, [selectValue, isCheck, selectedDate, selectTime]);

    // Date selection
    const handleDateChange = (_date, dateString) => {

        setSelectedDate(dateString);

        setSelecDay(
            moment(dateString).format('dddd').toLowerCase()
        );

        setSelectTime('');
    };

    // Disable past and distant dates
    const disabledDateTime = (currentDate) => {

        return (
            currentDate &&
            (
                currentDate < moment().add(1, 'day').startOf('day') ||
                currentDate > moment().add(8, 'days').startOf('day')
            )
        );
    };

    // Time selection
    const handleSelectTime = (date) => {
        setSelectTime(date);
    };

    // Navigation between booking steps
    const next = () => {
        setCurrent((previous) => previous + 1);
    };

    const prev = () => {
        setCurrent((previous) => previous - 1);
    };

    // Available time content
    let dContent = null;

    if (dIsLoading) {
        dContent = <div>Loading ...</div>;
    }

    if (!dIsLoading && dIsError) {
        dContent = <div>Something went wrong while loading time slots.</div>;
    }

    if (!dIsLoading && !dIsError && time?.length === 0) {
        dContent = <Empty description="Doctor Is not Available" />;
    }

    if (!dIsLoading && !dIsError && time?.length > 0) {

        dContent = (
            <>
                {time.map((item, id) => (

                    <div className="col-md-4" key={item.id || id}>

                        <Button
                            type={
                                item?.slot?.time === selectTime
                                    ? 'primary'
                                    : 'default'
                            }
                            shape="round"
                            size="large"
                            className="mb-3"
                            onClick={() =>
                                handleSelectTime(item?.slot?.time)
                            }
                        >
                            {item?.slot?.time}
                        </Button>

                    </div>

                ))}
            </>
        );
    }

    // Doctor details
    let content = null;

    if (!isLoading && isError) {
        content = <div>Something went wrong!</div>;
    }

    if (!isLoading && !isError && !data?.id) {
        content = <Empty description="Doctor not found" />;
    }

    if (!isLoading && !isError && data?.id) {

        content = (
            <>
                <div className="booking-doc-img my-3 mb-3 rounded">

                    <Link to={`/doctors/${data?.id}`}>
                        <img src={img} alt="Doctor" />
                    </Link>

                    <div className="text-start">

                        <Link
                            to={`/doctors/${data?.id}`}
                            style={{ textDecoration: 'none' }}
                        >
                            Dr. {data?.firstName} {data?.lastName}
                        </Link>

                        <p className="form-text mb-0">
                            <FaArchway />
                            {' '}
                            {data?.specialization},
                            {data?.experienceHospitalName}
                        </p>

                    </div>
                </div>
            </>
        );
    }

    // Booking steps
    const steps = [

        {
            title: 'Select Appointment Date & Time',

            content: (
                <SelectDateAndTime
                    content={content}
                    handleDateChange={handleDateChange}
                    disabledDateTime={disabledDateTime}
                    selectedDate={selectedDate}
                    dContent={dContent}
                    selectTime={selectTime}
                />
            )
        },

        {
            title: 'Patient Information',

            content: (
                <PersonalInformation
                    handleChange={handleChange}
                    selectValue={selectValue}
                    setPatientId={setPatientId}
                />
            )
        },

        {
            title: 'Payment',

            content: (
                <CheckoutPage
                    handleChange={handleChange}
                    selectValue={selectValue}
                    isCheck={isCheck}
                    setIsChecked={setIsChecked}
                    data={data}
                    selectedDate={selectedDate}
                    selectTime={selectTime}
                />
            )
        }
    ];

    const items = steps.map((item) => ({
        key: item.title,
        title: item.title
    }));

    // Confirm appointment booking
    const handleConfirmSchedule = () => {

        const isCashPayment = selectValue.paymentType === 'cash';

        const obj = {};

        obj.patientInfo = {

            firstName: selectValue.firstName,
            lastName: selectValue.lastName,
            email: selectValue.email,
            phone: selectValue.phone,

            scheduleDate: selectedDate,
            scheduleTime: selectTime,

            doctorId: doctorId,

            patientId:
                role === 'patient'
                    ? patientId
                    : undefined
        };

        // Cash does not require card information
        if (isCashPayment) {

            obj.payment = {
                paymentType: 'cash',
                paymentMethod: 'cash'
            };

        } else {

            obj.payment = {

                paymentType: 'creditCard',
                paymentMethod: selectValue.paymentMethod,

                cardNumber: selectValue.cardNumber,
                cardExpiredYear: selectValue.cardExpiredYear,
                cvv: selectValue.cvv,
                expiredMonth: selectValue.expiredMonth,
                nameOnCard: selectValue.nameOnCard
            };
        }

        createAppointment(obj);
    };

    // Successful booking / API error
    useEffect(() => {

        if (createIsSuccess && appointmentData) {

            message.success('Appointment successfully scheduled');

            dispatch(addInvoice({ ...appointmentData }));

            setSelectValue(initialValue);

            navigation(`/booking/success/${appointmentData.id}`);
        }

        if (createIsError) {

            message.error(
                createError?.data?.message ||
                createError?.data?.error ||
                'Appointment booking failed. Please try again.'
            );
        }

    }, [
        createIsSuccess,
        createIsError,
        appointmentData,
        createError,
        dispatch,
        navigation
    ]);

    return (

        <>
            <Header />

            <div
                className="container"
                style={{
                    marginBottom: '12rem',
                    marginTop: '8rem'
                }}
            >

                <Steps
                    current={current}
                    items={items}
                />

                <div className="mb-5 mt-3 mx-3">
                    {steps[current].content}
                </div>

                <div className="text-end mx-3">

                    {/* NEXT BUTTON */}
                    {current < steps.length - 1 && (

                        <Button
                            type="primary"
                            disabled={
                                current === 0
                                    ? !selectTime
                                    : IsdDisable || !selectTime
                            }
                            onClick={next}
                        >
                            Next
                        </Button>

                    )}

                    {/* CONFIRM BUTTON */}
                    {current === steps.length - 1 && (

                        <Button
                            type="primary"
                            disabled={IsConfirmDisable}
                            loading={createIsLoading}
                            onClick={handleConfirmSchedule}
                        >
                            Confirm Appointment
                        </Button>

                    )}

                    {/* PREVIOUS BUTTON */}
                    {current > 0 && (

                        <Button
                            style={{ margin: '0 8px' }}
                            onClick={prev}
                            disabled={createIsLoading}
                        >
                            Previous
                        </Button>

                    )}

                </div>

            </div>

            <Footer />
        </>
    );
};

export default DoctorBooking;
