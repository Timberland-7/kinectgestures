window.KinectGestures = window.KinectGestures ? window.KinectGestures : {};

(function(){
    
    var timeoutRegisterPos, 
        intervalRegisterPos, 
        initTimeRegister = 0;

    function PlayerRegister(){}

    PlayerRegister.initPositionPlayer1 = null;
    PlayerRegister.initPositionPlayer2 = null;
    PlayerRegister.isRegistering = false;
    PlayerRegister.isCalibrating = false;
    PlayerRegister.started = false;
    PlayerRegister.player1Engaged = false;
    PlayerRegister.player1Detected = false;
    PlayerRegister.player2Engaged = false;
    PlayerRegister.player2Detected = false;
    PlayerRegister.registeredPositions = {};

    /*function calibrateMsg()
    {   
        var timeLeft = Date.now()-initTimeRegister;
        timeLeft = Math.round(timeLeft/1000);
        timeLeft = 5-timeLeft;
        KinectGestures.log('Calibrating Position '+ timeLeft + 's');
    }*/

    /*function registerPosition()
    {
        clearTimeout(timeoutRegisterPos);
        clearInterval(intervalRegisterPos);
        PlayerRegister.isRegistering = false;
        PlayerRegister.isCalibrating = false;
        KinectGestures.log('Position Calibrated');
    }*/

    /*function initCalibration()
    {
        timeoutRegisterPos = setTimeout(registerPosition,5000);
        initTimeRegister = Date.now();
        intervalRegisterPos = setInterval(calibrateMsg,1000);
    }*/

    PlayerRegister.init = function()
    {
        //clearTimeout(timeoutRegisterPos);
        //clearInterval(intervalRegisterPos);
        PlayerRegister.isRegistering = true;
        PlayerRegister.player1Detected = false;
        PlayerRegister.player2Detected = false;
        KinectGestures.on(KinectGestures.EventType.PlayerLost, PlayerRegister.onPlayerLost);
    }

    PlayerRegister.onPlayerLost = function(event)
    {
        if (event.relativePosition === 1){
            PlayerRegister.player1Detected = false;
        }
        else{
            PlayerRegister.player2Detected = false;
        }
    }

    PlayerRegister.getPlayerById = function(trackingId)
    {
        if (PlayerRegister.initPositionPlayer1 && PlayerRegister.initPositionPlayer1.trackingId === trackingId)
        {
            return PlayerRegister.initPositionPlayer1
        }
        if (PlayerRegister.initPositionPlayer2 && PlayerRegister.initPositionPlayer2.trackingId === trackingId)
        {
            return PlayerRegister.initPositionPlayer2
        }

        return null;
    }

    PlayerRegister.getRefSkeletonById = function(trackingId)
    {
        var pl = PlayerRegister.getPlayerById(trackingId);
        return pl ? pl.skeleton : null;
    }

    PlayerRegister.registerPlayerPosition = function(skeleton)
    {   
        // TODO calibrate skeleton on 
        if (skeleton.position.x <= 0){
            PlayerRegister.initPositionPlayer1 = skeleton.position;
            PlayerRegister.initPositionPlayer1.trackingId = skeleton.trackingId;
            PlayerRegister.initPositionPlayer1.skeleton = skeleton;
            PlayerRegister.initPositionPlayer1.playerNum = 1;
            PlayerRegister.player1Engaged = true;
            KinectGestures.emit(KinectGestures.EventType.PlayerRegister, {playerNum:1, trackingId:skeleton.trackingId});
        }
        else{
            PlayerRegister.initPositionPlayer2 = skeleton.position;
            PlayerRegister.initPositionPlayer2.trackingId = skeleton.trackingId;
            PlayerRegister.initPositionPlayer2.skeleton = skeleton;
            PlayerRegister.initPositionPlayer2.playerNum = 2;
            PlayerRegister.player2Engaged = true;
            KinectGestures.emit(KinectGestures.EventType.PlayerRegister, {playerNum:2, trackingId:skeleton.trackingId});
        }
       
        if (KinectGestures.options.numPlayersToRegister === 1 || 
           (PlayerRegister.player1Engaged && PlayerRegister.player2Engaged) )
        {
            PlayerRegister.isRegistering = false;
            PlayerRegister.isCalibrating = false;
        }   
    }

    PlayerRegister.reset = function()
    {
        PlayerRegister.started = false;
        PlayerRegister.player1Engaged = false;
        PlayerRegister.player2Engaged = false;
        PlayerRegister.registeredPositions = {};
    }

    // TODO manage the case in which one of the two players disappears when registering 
    PlayerRegister.update = function (frame)
    {
        if (PlayerRegister.isRegistering){
            var playersTracked = 0;
            for (var iSkeleton = 0; iSkeleton < frame.skeletons.length; ++iSkeleton) {

                var skeleton = frame.skeletons[iSkeleton];
                            
                if (skeleton.trackingState > 1){
                    playersTracked++;
                    //PlayerRegister.registeredPositions[skeleton.trackingId] = skeleton.position;
                    /*if (skeleton.position.x <= 0 && !PlayerRegister.player1Engaged){
                        PlayerRegister.initPositionPlayer1 = skeleton.position;
                        PlayerRegister.initPositionPlayer1.trackingId = skeleton.trackingId;
                    }
                    else if (skeleton.position.x > 0 && !PlayerRegister.player2Engaged){
                        PlayerRegister.initPositionPlayer2 = skeleton.position;
                        PlayerRegister.initPositionPlayer2.trackingId = skeleton.trackingId;
                    }*/
                    if (PlayerRegister.isRegistering)
                    {   
                        var relativePosition = skeleton.position.x <= 0 ? 1 : 2;
                        if (relativePosition === 1 && !PlayerRegister.player1Detected){
                            PlayerRegister.player1Detected = true;
                            KinectGestures.emit(KinectGestures.EventType.PlayerTracked, {relativePosition:relativePosition, skeleton:skeleton});
                        }
                        if (relativePosition === 2 && !PlayerRegister.player2Detected){
                            PlayerRegister.player2Detected = true;
                            KinectGestures.emit(KinectGestures.EventType.PlayerTracked, {relativePosition:relativePosition, skeleton:skeleton});
                        }
                    }
                   
                }
            }
            if (playersTracked === KinectGestures.options.numPlayersToRegister && !PlayerRegister.isCalibrating){
                
                PlayerRegister.isCalibrating = true;
                KinectGestures.emit(KinectGestures.EventType.PlayersTracked);
            }
            
            
        }

    } 

    // check if the current skeleton is currently traked as player
    // otherwise it assigns to the player the new trackingId
    // according to his position
    // TODO ask if right logic
    // TODO can we use this function to determine which are the players?

    // TODO TEST!
    PlayerRegister.checkSkeletonTracking = function(skeletons){
        
        var found = 0, indexFound;
        
        for (var i = skeletons.length - 1; i >= 0; i--) {
            var skeleton = skeletons[i];
            if (PlayerRegister.initPositionPlayer1 && skeleton.trackingId === PlayerRegister.initPositionPlayer1.trackingId)
            {
                found = found > 1 ? 3 : 1;
                indexFound = i;
                //KinectGestures.log('found-1:'+skeletons[i].trackingId);
            }
            if (PlayerRegister.initPositionPlayer2 && skeleton.trackingId === PlayerRegister.initPositionPlayer2.trackingId)
            {
                found = found > 1 ? 3 : 2;
                indexFound = i;
                //KinectGestures.log('found-2:' + skeletons[i].trackingId);
            
            }
            /*if (PlayerRegister.initPositionPlayer2){
                KinectGestures.log('found-2:' + PlayerRegister.initPositionPlayer2.trackingId);
            }
             if (PlayerRegister.initPositionPlayer1){
                KinectGestures.log('found-1:' + PlayerRegister.initPositionPlayer1.trackingId);
            }*/
        }

        // some skeleton is not being traked before
        if (found < 3){
            
            // found player 1 => the new is player2
            if (found === 1 && skeletons.length > 1){
                if (PlayerRegister.initPositionPlayer2){
                    PlayerRegister.initPositionPlayer2.trackingId = skeletons[indexFound === 0 ? 1 : 0].trackingId;
                    KinectGestures.emit(KinectGestures.EventType.PlayerEngagedAgain, {trackingId:PlayerRegister.initPositionPlayer2.trackingId, playerNum:2, relativePosition:2});
                }
            }
            // found player 2 => the is player 1
            else if (found === 2 && skeletons.length > 1)   
            {
                if (PlayerRegister.initPositionPlayer1){
                    PlayerRegister.initPositionPlayer1.trackingId =  skeletons[indexFound === 0 ? 1 : 0].trackingId;
                    KinectGestures.emit(KinectGestures.EventType.PlayerEngagedAgain, {trackingId:PlayerRegister.initPositionPlayer1.trackingId, playerNum:1, relativePosition:1});
                }
            }
            // re-assign based on position
            else if (found === 0 && skeletons.length > 0)
            {   
                // we have tu mutually exclude the skeletons
                // so we guess natural positions
                if (skeletons.length === 1){
                    // assign in base of the absolute position
                    if (skeletons[0].position.x <= 0)
                    {
                        if (PlayerRegister.initPositionPlayer1){
                            PlayerRegister.initPositionPlayer1.trackingId =  skeletons[0].trackingId;
                            KinectGestures.emit(KinectGestures.EventType.PlayerEngagedAgain, {trackingId:PlayerRegister.initPositionPlayer1.trackingId, playerNum:1, relativePosition:1});   
                        }
                    }
                    else 
                    {
                        if (PlayerRegister.initPositionPlayer2){
                            PlayerRegister.initPositionPlayer2.trackingId =  skeletons[0].trackingId;
                            KinectGestures.emit(KinectGestures.EventType.PlayerEngagedAgain, {trackingId:PlayerRegister.initPositionPlayer2.trackingId, playerNum:2, relativePosition:2});
                        }
                    }
                }
                else{
                    // assign based on the relative position of the players
                    if (skeletons[0].position.x < skeletons[1].position.x){
                        if (PlayerRegister.initPositionPlayer1){
                            PlayerRegister.initPositionPlayer1.trackingId = skeletons[0].trackingId;
                            KinectGestures.emit(KinectGestures.EventType.PlayerEngagedAgain, {trackingId:PlayerRegister.initPositionPlayer1.trackingId, playerNum:1, relativePosition:1});
                        }
                        if (PlayerRegister.initPositionPlayer2){
                            PlayerRegister.initPositionPlayer2.trackingId = skeletons[1].trackingId;
                            KinectGestures.emit(KinectGestures.EventType.PlayerEngagedAgain, {trackingId:PlayerRegister.initPositionPlayer2.trackingId, playerNum:2, relativePosition:2});
                        }
                    }
                    else{
                        if (PlayerRegister.initPositionPlayer1){
                            PlayerRegister.initPositionPlayer1.trackingId = skeletons[1].trackingId;
                            KinectGestures.emit(KinectGestures.EventType.PlayerEngagedAgain, {trackingId:PlayerRegister.initPositionPlayer1.trackingId, playerNum:1, relativePosition:1});
                        }
                        if (PlayerRegister.initPositionPlayer2){
                            PlayerRegister.initPositionPlayer2.trackingId = skeletons[0].trackingId;
                            KinectGestures.emit(KinectGestures.EventType.PlayerEngagedAgain, {trackingId:PlayerRegister.initPositionPlayer2.trackingId, playerNum:2, relativePosition:2});
                        }
                    }
                }
            }
        }

    }

    KinectGestures.PlayerRegister = PlayerRegister;


})();