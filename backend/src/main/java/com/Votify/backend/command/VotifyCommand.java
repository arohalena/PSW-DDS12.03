package com.Votify.backend.command;

public interface VotifyCommand<R> {
    R execute();
}
