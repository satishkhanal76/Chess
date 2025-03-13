export default class Socket {
    static EVENTS = {
        SERVER_ERROR: "serverError",
        USER_CONNECTION: "connection",
        USER_DISCONNECTION: "disconnect",
        CONNECTION_SUCCESS: "connect",
        CONNECTION_ERROR: "connect_error",
        CREATE_ROOM: "createRoom",
        ROOM_JOIN_SUCCESS: "roomJoinSuccess",
        JOIN_ROOM: "joinRoom",
        ROOM_NOT_FOUND: "roomNotFound",
        ROOM_DESTROYED: "roomDestroyed",
        ROOM_PLAYER_LEFT: "roomPlayerLeft",
        CREATE_GAME: "createGame",
        GAME_CREATED: "gameCreated",
        MOVE_PIECE: "movePiece",
        MOVE_INVALID: "moveInvalid"
    }
}