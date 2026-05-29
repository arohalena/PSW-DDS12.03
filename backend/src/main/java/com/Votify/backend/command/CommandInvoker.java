package com.Votify.backend.command;

import org.springframework.stereotype.Component;

@Component
public class CommandInvoker {
    public <R> R execute(VotifyCommand<R> command) {
        return command.execute();
    }
}
