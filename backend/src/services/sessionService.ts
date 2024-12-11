
import { redisService } from 'ondc-automation-cache-lib';
import { SessionData } from '../interfaces/sessionData';
import { TransformedSessionData, SessionKeyType } from '../interfaces/sessionData';
// import redisClient from '../config/redisConfig';


const SESSION_EXPIRY = 3600; // 1 hour

export const createSessionService = async (sessionId: string, data: SessionData) => {
    const { city, domain, participantType, subscriberId, subscriberUrl, version } = data;


    const transformedData: TransformedSessionData = {
        active_session_id: sessionId,
        type: participantType,
        domain,
        version,
        city,
        np_id: subscriberId,
        session_payloads: {
            STATION_CODE:[]
        },
        context_cache: {
            latest_timestamp: new Date().toISOString(),
            latest_action: '',
            subscriber_id: subscriberId,
            subscriber_url: subscriberUrl,
            message_ids: [],
        }
    };
    
    try {
        // Store session data in Redis
        await redisService.setKey(subscriberUrl, JSON.stringify(transformedData), SESSION_EXPIRY);
        // await redisClient.set(sessionId, JSON.stringify(sessionData), 'EX', 3600);
        return 'Session created successfully';

    } catch (error: any) {
        throw new Error(`${error.message}`)
    }
};

export const getSessionService = async (sessionKey: SessionKeyType) => {

    try {
        // Fetch session data from Redis
        // const sessionData = await redisClient.get(sessionId);
        const sessionData = await redisService.getKey(sessionKey);
        if (!sessionData) {
            throw new Error('Session not found');
        }

        // Return the session data if found
        return JSON.parse(sessionData);

    } catch (error: any) {
        // Return a 500 error in case of any issues
        throw new Error(`${error.message}`)
    }

};


// Update session data
export const updateSessionService = async (subscriber_url: string, data: any) => {

    const { subscriberId, participantType, domain, transactionId, transactionMode, state, details, flowId, subscriberUrl } = data;

    try {
        // Retrieve the session data from Redis
        const sessionData = await redisService.getKey(subscriber_url);

        if (!sessionData) {
            throw new Error('Session not found')
        }

        const session: TransformedSessionData = JSON.parse(sessionData);

        // Update session data fields
        if (subscriberId) session.context_cache.subscriber_id = subscriberId;
        if (participantType) session.type = participantType;
        if (domain) session.domain = domain;
        if (flowId) session.current_flow_id = flowId;

        // If transaction data is provided, update the transaction details
        // if (transactionId && transactionMode && state) {
        //     session.transactions[transactionId] = {
        //         transactionMode,
        //         state,
        //         data: details || {},
        //         createdAt: new Date().toISOString(),
        //     };
        // }

        // Save the updated session data back to Redis
        await redisService.setKey(subscriber_url, JSON.stringify(session), SESSION_EXPIRY);

        return 'Session updated successfully';


    } catch (error: any) {
        throw new Error(`${error.message}`);
    }
};